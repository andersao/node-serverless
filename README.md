# Node ABL Scaffold


## Migrations

Criar um arquivo de migração:

`npm run db:migrate:generate create_some_table`

Executar as migrações

`npm run db:migrate`

Executar roolback

`npm run db:migrate:rollback`


## Servidor

`node server.js`



## Upload Lambda

1. `zip -r lambda.zip -r .`
2. `aws lambda update-function-code --function-name={FUNCTION_NAME} --zip-file=fileb://lambda.zip --profile {PROFILE}`
