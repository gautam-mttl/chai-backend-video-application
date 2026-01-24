import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"                                  //usedin cryptography, it generates token for user authentication
import bcrypt from "bcrypt"                                     //bcrpyt helps to hash password before saving to database

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
        },
        fullName: {
            type: String,
            required: true,
            trim: true, 
            index: true
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)


//Latestmongoose pre hooks are now designed to run one by one without any next flag.So we dont need to call next() here
userSchema.pre("save", async function() {                           //mongoose middleware hooks used to perform soemthing just before a function is execute (here before saving user data to database)
    if(!this.isModified("password")) {                                  //if password is not modified, return next
        return;
    }                                                                   
    this.password = await bcrypt.hash(this.password, 10);               //10 is salt rounds, higher the rounds more secure the hash but takes more time to generate hash
});                                                                               


//we are adding another property/object to userSchema and object can be function,array anything
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {                                                               //PAYLOAD: all the information given   
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
} 

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {                                                               //PAYLOAD: all the information given   
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);
