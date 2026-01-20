import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";  //helps us to write aggregate queries of mongoDB

// const videoSchema = new mongoose.Schema({})  // this is used when we don't import Schema separately

const videoSchema = new Schema(
    {
        thumbnail: {
            type: String, //cloudinary URL
            required: true
        },
        videoFile: {
            type: String, //cloudinary URL
            required: true
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number,  //Cloudinary provides duration in seconds
            required: true
        },
        views: {
            type: Number,   
            default: 0
        },
        isPublised: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,       //mongoose.Schema.Types.ObjectId also works but Schema was imported separately here
            ref: "User"
        }
    }, 
    {timestamps: true}
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);