
**backend**:
```bash
source .venv/bin/activate
cd backend
uvicorn main:app --reload --port 8020
```
**frontend**:
```bash
npm run dev
```


**To run with Docker**:
```bash
cd backend
docker build -t demo-aca-backend .
docker run --rm -it -p 8080:8080 demo-aca-backend
```


**Github Setup**:
```bash
./scripts/configure-github.sh .azure/demo-aca/.env
./scripts/configure-github.sh .azure/demo-aca-vnet/.env
```