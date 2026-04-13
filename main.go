package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"fmt"
	"sync"
	"time"
)

type Event struct {
	ID      int    `json:"id"`
	Date    string `json:"date"`
	Tickets int    `json:"tickets"`
	Terms   bool   `json:"terms"`
}

type application struct {
	logger *slog.Logger
	mu     sync.Mutex
	store  []Event
	nextID int
}

func newApplication() *application {
	return &application{
		logger: slog.New(slog.NewTextHandler(os.Stdout, nil)),
		store:  []Event{},
		nextID: 0,
	}
}

func (app *application) routes() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/events", app.handleCreateEvent)
	mux.HandleFunc("GET /api/events", app.handleListEvents)
	mux.Handle("/", http.FileServer(http.Dir("./static")))

	return mux
}

func (app *application) handleCreateEvent(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Date    string `json:"date"`
		Tickets int    `json:"tickets"`
		Terms   bool   `json:"terms"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	input.Date = strings.TrimSpace(input.Date)

	if err := app.validateEvent(input.Date, input.Tickets, input.Terms); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	app.mu.Lock()
	app.nextID++
	e := Event{
		ID:      app.nextID,
		Date:    input.Date,
		Tickets: input.Tickets,
		Terms:   input.Terms,
	}
	app.store = append(app.store, e)
	app.mu.Unlock()

	app.logger.Info("event registered",
		"id", e.ID,
		"date", e.Date,
		"tickets", e.Tickets,
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(e)
}

func (app *application) handleListEvents(w http.ResponseWriter, r *http.Request) {
	app.mu.Lock()
	snapshot := make([]Event, len(app.store))
	copy(snapshot, app.store)
	app.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(snapshot)
}

func (app *application) validateEvent(date string, tickets int, terms bool) error {
	if date == "" {
		return fmt.Errorf("date is required")
	}

	parsed, err := time.Parse("2006-01-02", date)
	if err != nil {
		return fmt.Errorf("invalid date format")
	}

	if !parsed.After(time.Now()) {
		return fmt.Errorf("date must be in the future")
	}

	if tickets < 1 || tickets > 5 {
		return fmt.Errorf("tickets must be between 1 and 5")
	}

	if !terms {
		return fmt.Errorf("terms must be accepted")
	}

	return nil
}

func main() {
	app := newApplication()

	addr := ":4000"
	app.logger.Info("starting server", "addr", addr)

	if err := http.ListenAndServe(addr, app.routes()); err != nil {
		app.logger.Error(err.Error())
		os.Exit(1)
	}
}