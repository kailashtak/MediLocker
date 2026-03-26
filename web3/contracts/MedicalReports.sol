// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedicalReports {

    struct Report {
        uint patientId;
        string ipfsHash;
        uint timestamp;
    }

    uint public reportCount;

    mapping(uint => Report) public reports;
    mapping(uint => uint[]) public patientReports;
    mapping(uint => mapping(uint => bool)) public access;
    mapping(uint => address) public patientOwner;

    event ReportUploaded(uint reportId, uint patientId);
    event AccessGranted(uint reportId, uint doctorId);
    event AccessRevoked(uint reportId, uint doctorId);

    function setPatientOwner(uint _patientId, address _owner) external {
        require(patientOwner[_patientId] == address(0), "Already set");
        patientOwner[_patientId] = _owner;
    }

    function uploadReport(uint _patientId, string memory _ipfs) external {
        require(msg.sender == patientOwner[_patientId], "Not patient");

        reportCount++;

        reports[reportCount] = Report(
            _patientId,
            _ipfs,
            block.timestamp
        );

        patientReports[_patientId].push(reportCount);

        emit ReportUploaded(reportCount, _patientId);
    }

    function grantAccess(uint _reportId, uint _doctorId) external {
        uint patientId = reports[_reportId].patientId;

        require(msg.sender == patientOwner[patientId], "Not patient");

        access[_reportId][_doctorId] = true;

        emit AccessGranted(_reportId, _doctorId);
    }

    function revokeAccess(uint _reportId, uint _doctorId) external {
        uint patientId = reports[_reportId].patientId;

        require(msg.sender == patientOwner[patientId], "Not patient");

        access[_reportId][_doctorId] = false;

        emit AccessRevoked(_reportId, _doctorId);
    }

    function getReport(uint _reportId, uint _doctorId)
        external
        view
        returns (Report memory)
    {
        uint patientId = reports[_reportId].patientId;

        require(
            msg.sender == patientOwner[patientId] ||
            access[_reportId][_doctorId],
            "No access"
        );

        return reports[_reportId];
    }

    function getPatientReports(uint _patientId)
        external
        view
        returns (uint[] memory)
    {
        require(msg.sender == patientOwner[_patientId], "Not patient");
        return patientReports[_patientId];
    }
}