import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import stallRoutes from './routes/stalls.js'
import batchRoutes from './routes/batches.js'
import inspectionRoutes from './routes/inspections.js'
import inventoryRoutes from './routes/inventory.js'
import patrolRoutes from './routes/patrol.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/stalls', stallRoutes)
app.use('/api/batches', batchRoutes)
app.use('/api/inspections', inspectionRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/patrol', patrolRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: '菜市场溯源平台 API 服务运行正常',
      timestamp: new Date().toISOString(),
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server Error]', error)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: error.message,
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API 接口不存在',
    path: req.path,
  })
})

export default app
