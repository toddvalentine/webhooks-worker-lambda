package main

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"net/http"
	"runtime"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"golang.org/x/sync/errgroup"
)

type ServiceCaller struct {
	client *http.Client
}

var svc ServiceCaller

func Handler(ctx context.Context, e events.SQSEvent) error {
	var g errgroup.Group

	numWorkers := runtime.NumCPU()
	recordsChan := make(chan events.SQSMessage, numWorkers)
	resultsChan := make(chan int)

	for i := 0; i < cap(recordsChan); i++ {
		g.Go(func() error {
			if err := worker(recordsChan, resultsChan); err != nil {
				return err
			}
			return nil
		})
	}

	go func() {
		for _, r := range e.Records {
			log.Printf("sending to recordsChan: %s\n", r.Body)
			recordsChan <- r
		}
	}()

	for i := 0; i < len(e.Records); i++ {
		r := <-resultsChan
		log.Printf("results channel output: %d\n", r)
	}

	close(recordsChan)
	close(resultsChan)

	return g.Wait()
}

func worker(recordsChan <-chan events.SQSMessage, resultsChan chan<- int) error {
	for r := range recordsChan {
		endpoint := r.MessageAttributes["Endpoint"].StringValue
		signature := r.MessageAttributes["Signature"].StringValue
		status, err := svc.callService(context.Background(), *endpoint, *signature, r.Body)
		if err != nil {
			return err
		}

		resultsChan <- status
	}

	return nil
	// return fmt.Errorf("this is a test error")
}

func (sc ServiceCaller) callService(ctx context.Context, endpoint string, signature string, body string) (int, error) {
	r := bytes.NewBuffer([]byte(body))
	req, err := http.NewRequest(http.MethodPost, endpoint, r)
	if err != nil {
		return 0, err
	}
	req = req.WithContext(ctx)
	req.Header.Set("Content-Type", "application-json")
	req.Header.Set("X-vtypeio-Hmac-SHA256", signature)

	resp, err := sc.client.Do(req)
	if err != nil {
		log.Printf("error sending to service: %v", err)
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("unexpected status code: %d", resp.StatusCode)
		return 0, fmt.Errorf("unexpected status code %d", resp.StatusCode)
	}

	return resp.StatusCode, nil
}

func main() {
	svc = ServiceCaller{
		client: &http.Client{
			Timeout: time.Second * 3,
		},
	}

	lambda.Start(Handler)
}
