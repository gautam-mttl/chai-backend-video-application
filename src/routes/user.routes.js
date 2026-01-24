import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";                       //register user method me image upload krne k liye multer middleware use kr rhe h
import { verifyJWT } from "../middlewares/auth.middleware.js";
                                                                                  //registerUser method execute hone se phele middleware use krenge

const router = Router();
//routes ke andar middleware inject krenge

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,  logoutUser)                                //logoutUser ka controller/method run hone se phele I want middleware (to verify the acessToken) to run
router.route("/refresh-token").post(refreshAccessToken)

export default router;