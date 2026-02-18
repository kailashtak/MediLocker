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
  <div className="max-w-6xl mx-auto mt-10 space-y-10">

    {/* Header */}
    <div className="text-center">
      <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-fit mx-auto shadow-lg">
        <FaFileMedical className="h-10 w-10 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mt-4">
        Upload Medical Report
      </h2>
      <p className="text-gray-600 mt-2">
        Select report type and securely upload to blockchain
      </p>
    </div>

    {/* ===== ROW 1 ===== */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {["Blood Test", "X-Ray", "CT Scan", "MRI"].map((type) => (
        <Card
          key={type}
          onClick={() => setReportType(type)}
          className={`cursor-pointer p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
            reportType === type
              ? "border-2 border-blue-500 bg-blue-50"
              : "border"
          }`}
        >
          <FaFileMedical className="mx-auto text-blue-600 text-3xl mb-3" />
          <h3 className="font-semibold">{type}</h3>
        </Card>
      ))}
    </div>

    {/* ===== ROW 2 ===== */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {["Ultrasound", "ECG", "Prescription", "Lab Report"].map((type) => (
        <Card
          key={type}
          onClick={() => setReportType(type)}
          className={`cursor-pointer p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
            reportType === type
              ? "border-2 border-blue-500 bg-blue-50"
              : "border"
          }`}
        >
          <FaFileMedical className="mx-auto text-indigo-600 text-3xl mb-3" />
          <h3 className="font-semibold">{type}</h3>
        </Card>
      ))}
    </div>

    {/* ===== ROW 3 ===== */}
    <div>
      <Card
        onClick={() => setReportType("Other")}
        className={`cursor-pointer p-8 text-center transition-all duration-300 hover:shadow-xl ${
          reportType === "Other"
            ? "border-2 border-purple-500 bg-purple-50"
            : "border"
        }`}
      >
        <FaUpload className="mx-auto text-purple-600 text-4xl mb-3" />
        <h3 className="text-lg font-semibold">
          Upload Other Medical Reports
        </h3>
      </Card>
    </div>

    {/* ===== FILE UPLOAD SECTION ===== */}
    {reportType && (
      <Card className="p-8 space-y-6 border-2 border-blue-200 bg-blue-50">
        <h3 className="text-xl font-semibold">
          Selected: {reportType}
        </h3>

        <input
          type="file"
          onChange={handleFileChange}
          className="w-full border border-gray-300 rounded-lg p-3"
        />

        <Button
          onClick={handleUpload}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white h-14 rounded-xl"
          disabled={loading}
        >
          <FaUpload className="mr-2" />
          {loading ? "Uploading..." : "Upload Report"}
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push("/patient/dashboard")}
          className="w-full"
        >
          Back to Dashboard
        </Button>
      </Card>
    )}
  </div>
);

  };

  export default UploadReport;
