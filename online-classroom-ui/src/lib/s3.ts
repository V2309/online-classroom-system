import AWS from "aws-sdk";
import { parse } from "path";

// Tạo singleton AWS S3 instance để tránh memory leak
let s3Instance: AWS.S3 | null = null;

function getS3Instance(): AWS.S3 {
  if (!s3Instance) {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    s3Instance = new AWS.S3({
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
      },
      region: "us-east-1", // Thay đổi theo khu vực của bạn
      maxRetries: 3,
      retryDelayOptions: {
        customBackoff: function(retryCount) {
          return Math.pow(2, retryCount) * 100;
        }
      }
    });
  }
  return s3Instance;
}

export async function uploadToS3(file: File) {
  try {
    const s3 = getS3Instance();

    const file_key = "uploads/" + Date.now().toString() + file.name.replace(" ", "-"); // Thay đổi đường dẫn nếu cần
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: file_key, // Tên tệp trên S3
      Body: file, // Dữ liệu tệp
    };
    const upload = s3.putObject(params).on("httpUploadProgress", (evt) => {
      console.log("Upload progress:", parseInt(((evt.loaded*100)/evt.total).toString())) + "%";
    }).promise();

    await upload.then((data) => {
      console.log("File uploaded successfully:", file_key);
    
    })
    return Promise.resolve({
     file_key,
     file_name: file.name,
    });




  }
  

  
  
  
  catch (error) {
    console.error("Error updating AWS config:", error);
    throw new Error("Failed to configure AWS SDK");
  }
}

export function getS3Url(file_key: string) {
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.us-east-1.amazonaws.com/${file_key}`;
    return url;
}


// --- THÊM HÀM MỚI NÀY ---
export async function deleteFromS3(file_key: string) {
  try {
    const s3 = getS3Instance();

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: file_key, // 'file_key' là đường dẫn đến file trên S3
    };

    // Gửi lệnh xóa object đến S3
    await s3.deleteObject(params).promise();
    
    console.log("File deleted successfully from S3:", file_key);

  } catch (error) {
    console.error("Error deleting file from S3:", error);
    // Ném lỗi ra ngoài để server action có thể bắt được
    throw new Error("Failed to delete file from S3");
  }
}