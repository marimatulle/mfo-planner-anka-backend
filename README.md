# MFO Planner Project Anka

## Tecnologias utilizadas

**Backend – Node.js 20 + TypeScript**  
- Framework: Fastify 4 com `@fastify/swagger` para documentação.  
- ORM: Prisma ORM (PostgreSQL 15).  
- Validação: Zod v4 schemas integrados ao Fastify.  
- Autenticação: JWT.  
- Testes: Jest + Supertest (mínimo 80% coverage).  
- Linter/Format: ESLint.  

---

## Configuração do projeto

1. Clone o repositório e instale as dependências:
```bash
git clone
npm install
```

2. Crie um arquivo .env na raiz do projeto com as seguintes configurações:
```bash
DATABASE_URL="your_database"
JWT_SECRET="your_jwt_key"
JWT_EXPIRATION="1h"
```

3. É necessário ter um banco de dados PostgreSQL rodando no Docker.
   
4. Docker
    - O Dockerfile do backend utiliza Node 20 e realiza os seguintes passos:
      - Define /app como diretório de trabalho.
      - Copia os arquivos package*.json e instala as dependências (npm install).
      - Copia todo o restante do código para dentro do container.
      - Instala netcat-openbsd para poder usar o script wait-for-it.sh.
      - Dá permissão de execução para o wait-for-it.sh.
      - Gera os arquivos do Prisma (npx prisma generate) e compila o projeto (npm run build).
      - Expõe a porta 3001.
      - Executa o backend somente depois que o banco de dados estiver pronto, usando o wait-for-it.sh.
   
5. Prisma
   - Dentro do container do backend:
     ```bash
     docker exec -it mfoplannerproject-backend-1 sh
     npx prisma migrate dev --name init
     ```
     
    - Fora do container, gere o client do Prisma:
      ```bash
       npx prisma generate
       ```

6. Rodando o projeto
   - Dentro do container do backend:
       ```bash
       npm run dev
       ```

   - Para rodar os testes:
        ```bash
        npm run test
        ```

7. Documentação da API
    - A documentação interativa da API está disponível em:
      
         ```bash
        http://localhost:3001/docs
        ```
