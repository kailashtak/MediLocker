import { useState } from "react";
import { useHealthcareContract } from "../../hooks/useContract";
import ipfsService from "../../utils/ipfs";

export default function UploadReport() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("");
  const { uploadMedicalReport } = useHealthcareContract();

  const handleUpload = async () => {
    if (!file) return;

    // 1️⃣ Upload to IPFS
    const result = await ipfsService.uploadToIPFS(file, {
      name: `report-${Date.now()}`,
      type: "medical-report",
    });

    // 2️⃣ Get patientId
    const patientId = await contract.GET_PATIENT_ID(address);

    // 3️⃣ Store on blockchain
    await uploadMedicalReport(patientId, result.hash, type);

    alert("Report uploaded!");
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <select onChange={(e) => setType(e.target.value)}>
        <option>Blood Report</option>
        <option>X-Ray</option>
        <option>MRI</option>
      </select>
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
