import authMiddleware from "../middlewares/authMiddleware";
import { Router } from "express";
import DeliverablesController from "../controllers/deliverablesController";
import Deliverables from "@/models/Deliverables";

const DeliverablesRouter = Router();

DeliverablesRouter.get('/get/:id', authMiddleware(['lecturer']), DeliverablesController.getDeliverable);
DeliverablesRouter.get('/getList', authMiddleware(['lecturer', 'student']), DeliverablesController.getDeliverablesList);
DeliverablesRouter.post('/create', authMiddleware(['lecturer']), DeliverablesController.createDeliverable);
DeliverablesRouter.put('/edit/:id', authMiddleware(['lecturer']), DeliverablesController.editDeliverable);
DeliverablesRouter.delete('/delete/:id', authMiddleware(['lecturer']), DeliverablesController.deleteDeliverable);
DeliverablesRouter.get('/getDeliverablesList', authMiddleware(['lecturer']), DeliverablesController.getDeliverableListByBatch);

export { DeliverablesRouter };