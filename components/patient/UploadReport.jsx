import { useState } from "react";
import { useRouter } from "next/router";
import { Card, Button } from "../common";
import {
  FaUpload,
  FaFileMedical,
  FaXRay,
  FaHeartbeat,
  FaNotesMedical,
  FaFilePrescription,
} from "react-icons/fa";
import {
  MdHealthAndSafety,
  MdBloodtype,
  MdBiotech,
  MdMedicalServices,
} from "react-icons/md";
import toast from "react-hot-toast";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";

const UploadReport = () => {
  const router = useRouter();
  const { uploadMedicalReport, getPatientId } = useHealthcareContract();
  const { address } = useAccount();

  const [reportType, setReportType] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shareWithDoctor, setShareWithDoctor] = useState(false);
  const [uploadedReports, setUploadedReports] = useState([]);

  const reportTypes = [
    { name: "Blood Test", icon: MdBloodtype, color: "text-red-600" },
    { name: "X-Ray", icon: FaXRay, color: "text-blue-600" },
    { name: "CT Scan", icon: MdBiotech, color: "text-purple-600" },
    { name: "MRI", icon: FaHeartbeat, color: "text-pink-600" },
    { name: "Ultrasound", icon: MdMedicalServices, color: "text-emerald-600" },
    { name: "ECG", icon: FaHeartbeat, color: "text-green-600" },
    { name: "Prescription", icon: FaFilePrescription, color: "text-indigo-600" },
    { name: "Lab Report", icon: FaNotesMedical, color: "text-cyan-600" },
  ];

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
      if (!data.IpfsHash) throw new Error("IPFS upload failed");

      const ipfsHash = data.IpfsHash;

      // 2️⃣ Get patient ID
      const patientId = await getPatientId(address);

      // 3️⃣ Call Smart Contract
      await uploadMedicalReport(patientId, ipfsHash, reportType);

      setUploadedReports((prev) => [
        ...prev,
        { type: reportType, name: file.name },
      ]);

      toast.success("Medical report uploaded successfully 🚀");
      setFile(null);
      setReportType("");
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-8">

      {/* Header */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-8">
        <div className="text-center">
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
      </Card>

      {/* Report Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((item) => (
          <Card
            key={item.name}
            onClick={() => setReportType(item.name)}
            className={`cursor-pointer p-6 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
              reportType === item.name
                ? "border-2 border-blue-500 bg-blue-50 shadow-lg"
                : "border"
            }`}
          >
            <item.icon className={`mx-auto text-4xl mb-3 ${item.color}`} />
            <h3 className="font-semibold">{item.name}</h3>
          </Card>
        ))}
      </div>

      {/* Other Upload Card */}
      <Card
        onClick={() => setReportType("Other")}
        className={`cursor-pointer p-8 text-center transition-all duration-300 hover:shadow-xl transform hover:scale-105 ${
          reportType === "Other"
            ? "border-2 border-purple-500 bg-purple-50 shadow-lg"
            : "border"
        }`}
      >
        <FaUpload className="mx-auto text-purple-600 text-5xl mb-3" />
        <h3 className="text-lg font-semibold">
          Upload Other Medical Reports
        </h3>
      </Card>

      {/* Drag & Drop Upload */}
      <Card className="p-8 bg-white border">
        <div
          className="border-2 border-dashed border-blue-400 rounded-xl p-8 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setFile(e.dataTransfer.files[0]);
          }}
        >
          <FaUpload className="mx-auto text-blue-500 text-3xl mb-3" />
          <p className="text-gray-600">
            Drag & Drop file here or click below
          </p>

          <input
            type="file"
            onChange={handleFileChange}
            className="mt-4"
          />

          {file && (
            <p className="mt-2 text-green-600 font-medium">
              Selected: {file.name}
            </p>
          )}
        </div>

        {/* Share Toggle */}
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border mt-6">
          <span className="font-medium">
            Share with Doctor
          </span>
          <input
            type="checkbox"
            checked={shareWithDoctor}
            onChange={() => setShareWithDoctor(!shareWithDoctor)}
            className="w-5 h-5"
          />
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white h-14 rounded-xl"
          disabled={loading}
        >
          <FaUpload className="mr-2" />
          {loading ? "Uploading..." : "Upload Report"}
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push("/patient/dashboard")}
          className="w-full mt-4"
        >
          Back to Dashboard
        </Button>
      </Card>

      {/* Uploaded Reports Preview */}
      {uploadedReports.length > 0 && (
        <Card className="p-6 bg-white border">
          <h3 className="font-semibold mb-4">Uploaded Reports</h3>

          {uploadedReports.map((r, index) => (
            <div
              key={index}
              className="flex justify-between p-3 border-b"
            >
              <span>{r.type}</span>
              <span className="text-gray-500">{r.name}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default UploadReport;
