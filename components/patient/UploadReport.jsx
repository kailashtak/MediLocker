import { useState } from "react";
import { useRouter } from "next/router";
import { Card, Button } from "../common";
import { FaUpload, FaFileMedical } from "react-icons/fa";
import { MdHealthAndSafety } from "react-icons/md";
import toast from "react-hot-toast";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";


const UploadReport = () => {
  const router = useRouter();
  const [reportType, setReportType] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { uploadMedicalReport, getPatientId } = useHealthcareContract();
  const { address } = useAccount();


  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

const handleUpload = async () => {
  if (!file || !reportType) {
    toast.error("Please select file and report type");
    return;
  }

  try {
    setLoading(true);

    // 1️⃣ Upload to Pinata
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
        body: formData,
      }
    );

    const data = await res.json();

    if (!data.IpfsHash) {
      throw new Error("IPFS upload failed");
    }

    const ipfsHash = data.IpfsHash;

    // 2️⃣ Get patient ID
    const patientId = await getPatientId(address);

    // 3️⃣ Call Smart Contract
    await uploadMedicalReport(patientId, ipfsHash, reportType);

    toast.success("Medical report uploaded successfully 🚀");

  } catch (error) {
    console.error(error);
    toast.error("Upload failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="max-w-3xl mx-auto mt-10">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-8">
        <div className="text-center mb-8">
          <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-fit mx-auto shadow-lg">
            <FaFileMedical className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-4 flex items-center justify-center gap-2">
            Upload Medical Report
            <MdHealthAndSafety className="text-blue-600" />
          </h2>
          <p className="text-gray-600 mt-2">
            Securely store your medical records on blockchain
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block font-medium mb-2">Report Type</label>
            <input
              type="text"
              placeholder="e.g. Blood Test, X-Ray, MRI"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Upload File</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-lg p-3"
            />
          </div>

          <Button
            onClick={handleUpload}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white h-14 rounded-xl"
            disabled={loading}
          >
            <FaUpload className="mr-2" />
            {loading ? "Uploading..." : "Upload Report"}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/patient/dashboard")}
            className="w-full mt-2"
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UploadReport;
