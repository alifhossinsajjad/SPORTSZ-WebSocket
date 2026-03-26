import {Router, router} from 'express'

export const matchRouter = Router()


matchRouter.get('/', (req, res)=> {
    res.status(200).json({message: 'Match list'})
})