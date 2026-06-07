import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { inicializarBancoDeDados } from './models/database';
import { errorHandler } from './middlewares/validar';
import routes from './routes';
import { swaggerSpec, swaggerUiOptions } from './swagger';
const app=express();
const PORT=process.env.PORT??3000;
app.use(helmet({contentSecurityPolicy:false})); app.use(cors()); app.use(morgan('dev'));
app.use(express.json({limit:'10mb'})); app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
app.use('/api/docs',swaggerUi.serve,swaggerUi.setup(swaggerSpec,swaggerUiOptions));
app.get('/api/docs.json',(_req,res)=>res.json(swaggerSpec));
app.use('/api',routes);
app.use(errorHandler);
inicializarBancoDeDados();
if(process.env.NODE_ENV!=='test'){
  app.listen(PORT,()=>console.log(`\n✅ Servidor rodando em http://localhost:${PORT}\n📚 Documentação: http://localhost:${PORT}/api/docs\n`));
}
export default app;
