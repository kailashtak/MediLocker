import { useState } from "react";
import { FiUpload, FiFileText } from "react-icons/fi";
import { Card, Button } from "../common";
import ipfsService from "../../utils/ipfs";
import { useHealthcareContract } from "../../hooks/useContract";
import toast from "react-hot-toast";

const PatientMedicalReports = ({ patientId }) => {
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState([]);

  const { uploadMedicalReport, getPatientReports } = useHealthcareContract();

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      const result = await ipfsService.uploadToIPFS(file, {
        name: `medical-report-${Date.now()}`
      });

      const hash = result.hash;

      await uploadMedicalReport(patientId, hash);

      toast.success("Medical report uploaded");

      loadReports();

    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const loadReports = async () => {
    try {
      const data = await getPatientReports(patientId);
      setReports(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200">
      <div className="p-6">

        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FiFileText className="text-cyan-600"/>
          Medical Reports
        </h3>

        <div className="mb-4">
          <label className="cursor-pointer">
            <Button disabled={uploading}>
              <FiUpload className="mr-2"/>
              Upload Report
            </Button>

            <input
              type="file"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="space-y-2">
          {reports.map((r, i) => (
            <div key={i} className="p-3 bg-white rounded-lg border">
              <a
                href={`https://gateway.pinata.cloud/ipfs/${r.ipfsHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                View Report #{r.id}
              </a>
            </div>
          ))}
        </div>

      </div>
    </Card>
  );
};

export default PatientMedicalReports;