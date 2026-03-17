import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tenantsRouter from "./tenants";
import marketsRouter from "./markets";
import categoriesRouter from "./categories";
import sectionsRouter from "./sections";
import formDefinitionsRouter from "./formDefinitions";
import formInstancesRouter from "./formInstances";
import formEntriesRouter from "./formEntries";
import usersRouter from "./users";
import seedRouter from "./seed";
import responsibilitiesRouter from "./responsibilities";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tenantsRouter);
router.use(marketsRouter);
router.use(categoriesRouter);
router.use(sectionsRouter);
router.use(formDefinitionsRouter);
router.use(formInstancesRouter);
router.use(formEntriesRouter);
router.use(usersRouter);
router.use(seedRouter);
router.use(responsibilitiesRouter);

export default router;
