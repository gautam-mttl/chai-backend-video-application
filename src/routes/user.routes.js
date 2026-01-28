import { Router } from "express";
import { loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser,
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory 
}from "../controllers/user.controller.js";
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
router.route("/logout").post(verifyJWT,  logoutUser)                                        //logoutUser ka controller/method run hone se phele I want middleware (to verify the acessToken) to run
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)                                //want to get
router.route("/update-account").patch(verifyJWT, updateAccountDetails)                      //.patch, kyuki post m saari details udates hojaygi

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)                           // we are taking the value of username for a channel through params in our controller, so that's the way to write it---> /c(or channel)/:username
router.route("/history").get(verifyJWT, getWatchHistory)

export default router;