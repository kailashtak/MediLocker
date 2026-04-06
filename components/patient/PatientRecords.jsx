import React, { useState, useEffect } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../config/contract";

const PatientRecords = () => {
  const [files, setFiles] = useState([]);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [search, setSearch] = useState("");

  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorNames, setDoctorNames] = useState({});

  const [preview, setPreview] = useState(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const PATIENT_ID = 1; // 🔥 FIXED HERE

  // ================= TOAST =================
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ================= UPLOAD =================
  const addMedicalRecord = async () => {
    if (!files.length) {
      showToast("Please select files ⚠️", "error");
      return;
    }

    try {
      setLoading(true);

      for (let file of files) {
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

        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "ADD_MEDICAL_RECORD",
          args: [PATIENT_ID, data.IpfsHash, file.name, file.type],
        });
      }

      showToast("Upload successful ✅");
      setFiles([]);
      fetchRecords();
    } catch {
      showToast("Upload failed ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH =================
  const fetchRecords = async () => {
    const data = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "GET_PATIENT_RECORDS",
      args: [PATIENT_ID],
    });

    setRecords(data);
    setFilteredRecords(data);
  };

  const fetchDoctors = async () => {
    const data = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "GET_ALL_APPROVED_DOCTORS",
    });

    setDoctors(data);
    setFilteredDoctors(data);
    fetchDoctorNames(data);
  };

  const fetchDoctorNames = async (docs) => {
    const names = {};

    for (let doc of docs) {
      try {
        const res = await fetch(doc.IPFS_URL);
        const data = await res.json();
        names[doc.accountAddress] = data.name;
      } catch {
        names[doc.accountAddress] = "Doctor";
      }
    }

    setDoctorNames(names);
  };

  // ================= SEARCH =================
  useEffect(() => {
    setFilteredRecords(
      records.filter((r) =>
        r.fileName.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, records]);

  useEffect(() => {
    setFilteredDoctors(
      doctors.filter((doc) =>
        (doctorNames[doc.accountAddress] || "")
          .toLowerCase()
          .includes(doctorSearch.toLowerCase())
      )
    );
  }, [doctorSearch, doctors, doctorNames]);

  // ================= ACCESS (🔥 FIXED) =================
  const grantAccess = async (address) => {
    await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "GRANT_ACCESS",
      args: [PATIENT_ID, address], // ✅ FIX
    });

    showToast("Access granted ✅");
  };

  const revokeAccess = async (address) => {
    await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "REVOKE_ACCESS",
      args: [PATIENT_ID, address], // ✅ FIX
    });

    showToast("Access revoked ❌", "error");
  };

  useEffect(() => {
    fetchRecords();
    fetchDoctors();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">

      {/* TOAST */}
      {toast && (
        <div className="fixed top-28 right-6 z-[9999] px-6 py-3 rounded-xl shadow-xl text-white 
        bg-gradient-to-r from-green-500 to-emerald-600">
          {toast.msg}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Patient Medical Records
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upload */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <input
            type="file"
            multiple
            onChange={(e) => setFiles([...e.target.files])}
            className="mb-3"
          />

          <button
            onClick={addMedicalRecord}
            disabled={!files.length || loading}
            className={`w-full py-3 rounded-lg text-white font-semibold ${
              !files.length
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-105"
            }`}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {/* Records */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full mb-3 p-3 border rounded-lg"
          />

          {filteredRecords.map((r) => (
            <div key={r.fileHash} className="flex justify-between p-2 hover:bg-gray-100 rounded">
              <span>{r.fileName}</span>

              <button
                onClick={() => {
                  setPreviewLoaded(false);
                  setPreview({
                    url: `https://ipfs.io/ipfs/${r.fileHash}`,
                    type: r.fileType,
                  });
                }}
                className="text-blue-600 hover:underline"
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* DOCTORS */}
      <div className="mt-10 bg-white p-8 rounded-3xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          Manage Doctor Access
        </h2>

        <input
          placeholder="Search doctor..."
          value={doctorSearch}
          onChange={(e) => setDoctorSearch(e.target.value)}
          className="w-full mb-6 p-3 border rounded-lg"
        />

        <div className="space-y-4">
          {filteredDoctors.map((doc) => {
            const name = doctorNames[doc.accountAddress] || "Doctor";

            return (
              <div
                key={doc.accountAddress}
                className="flex justify-between items-center p-4 rounded-xl bg-gray-50"
              >
                <span className="font-semibold">{name}</span>

                <div className="flex gap-3">
                  <button
                    onClick={() => grantAccess(doc.accountAddress)}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105"
                  >
                     Grant
                  </button>

                  <button
                    onClick={() => revokeAccess(doc.accountAddress)}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 text-white hover:scale-105"
                  >
                     Revoke
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PREVIEW */}
      {preview && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-6">
          <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl">

            <button
              onClick={() => setPreview(null)}
              className="absolute top-4 right-4 bg-black text-white rounded-full w-10 h-10 flex items-center justify-center"
            >
              ✕
            </button>

            {!previewLoaded && (
              <div className="flex items-center justify-center h-full">
                Loading...
              </div>
            )}

            {preview.type.includes("image") ? (
              <img
                src={preview.url}
                onLoad={() => setPreviewLoaded(true)}
                className="w-full h-full object-contain"
              />
            ) : (
              <iframe
                src={preview.url}
                onLoad={() => setPreviewLoaded(true)}
                className="w-full h-full"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecords;