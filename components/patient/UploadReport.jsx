"use client";

import { useWriteContract } from "wagmi";
import { MEDICAL_REPORTS_ADDRESS, MEDICAL_REPORTS_ABI } from "@/config/contract";

export default function UploadReport() {
  const { writeContractAsync } = useWriteContract();

  const uploadReport = async () => {
    try {
      await writeContractAsync({
        address: MEDICAL_REPORTS_ADDRESS,
        abi: MEDICAL_REPORTS_ABI,
        functionName: "uploadReport",
        args: [1, "ipfs://report-from-ui"],
      });

      alert("Report uploaded!");
    } catch (err) {
      console.error(err);
      alert("Error uploading report");
    }
  };

  return (
    <button onClick={uploadReport}>
      Upload Report
    </button>
  );
}