import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import reviewsRouter from "./reviews";
import couponsRouter from "./coupons";
import usersRouter from "./users";
import adminRouter from "./admin";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(reviewsRouter);
router.use(couponsRouter);
router.use(usersRouter);
router.use(adminRouter);
router.use(stripeRouter);

export default router;
