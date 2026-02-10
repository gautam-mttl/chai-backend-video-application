import multer from "multer";            //wherever file upload is needed, there multer will be used

const storage = multer.diskStorage({        //code from github readme of multer
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
})