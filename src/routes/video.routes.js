import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyVideoOwnership } from "../middlewares/verifyVideoOwnership.js";

router.delete(
  "/:videoId",
  verifyJWT,
  verifyVideoOwnership,
  deleteVideo
);