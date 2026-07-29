import { Router } from 'express';
import { addVehicle, getMyVehicles } from '../controllers/vehicleController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/add', authenticate, addVehicle);
router.get('/my-vehicles', authenticate, getMyVehicles);

export default router;
