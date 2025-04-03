.PHONY: run install-ui install-api

run: 
	@echo "Starting both frontend and backend..."
	@make -j 2 run-ui run-api

run-ui:
	@echo "Starting Next.js development server..."
	@cd pen-ui && npm run dev

run-api:
	@echo "Starting FastAPI backend..."
	@cd pen-app && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

install-ui:
	@echo "Installing UI dependencies..."
	@cd pen-ui && npm install

install-api:
	@echo "Installing Python dependencies..."
	@cd pen-app && pip install -r requirements.txt

install: install-ui install-api

clean:
	@echo "Cleaning node_modules and __pycache__..."
	@rm -rf pen-ui/node_modules
	@find pen-app -name "__pycache__" -exec rm -rf {} +