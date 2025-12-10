
**backend**:
```bash
source .venv/bin/activate
cd backend
uvicorn main:app --reload --port 8020
```

**Required environment variables for content generation (Azure OpenAI)**:
```bash
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
export AZURE_OPENAI_API_KEY="your-api-key"
export AZURE_OPENAI_MODEL="gpt-4o"  # or your deployed model name
```

**frontend**:
```bash
npm run dev
```

**Cosmos DB Emulator**:
```bash
docker run \
   --name cosmos-emulator \
   --detach \
   --publish 8081:8081 \
   --publish 1234:1234 \
   mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
```
stop:
```bash
docker stop cosmos-emulator
```
remove:
```bash
docker rm cosmos-emulator
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