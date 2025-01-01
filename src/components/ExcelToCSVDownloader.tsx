import React, { useState } from "react";
import * as XLSX from "xlsx";
import excelImage from "../assets/excel.jpg"; // Adjust the path as needed

const ExcelToCSVDownloader: React.FC = () => {
    const [csvData, setCsvData] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("converted.csv");
    const [error, setError] = useState<string>("");

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setError("No file selected.");
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            const binaryData = e.target?.result;
            if (binaryData) {
                try {
                    // Read Excel file
                    const workbook = XLSX.read(binaryData, { type: "binary" });
                    const sheetName = workbook.SheetNames[0]; // Use the first sheet
                    const sheet = workbook.Sheets[sheetName];

                    // Convert to CSV
                    const csv = XLSX.utils.sheet_to_csv(sheet);
                    setCsvData(csv); // Store CSV data
                    setFileName(file.name.replace(/\.[^/.]+$/, ".csv")); // Set file name for download
                    setError("");
                } catch (err) {
                    setError("Error processing the Excel file.");
                    console.error(err);
                }
            }
        };

        reader.onerror = () => {
            setError("Error reading the file.");
        };

        reader.readAsBinaryString(file);
    };

    const downloadCSV = () => {
        if (!csvData) return;
        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <h1>Excel to CSV Converter</h1>


            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
            {error && <p style={{ color: "red" }}>{error}</p>}
            {csvData && (
                <div>
                    <h2>Download CSV</h2>
                    <button onClick={downloadCSV}>Download CSV</button>
                </div>
            )}

            <div className="description-container">
                <h1>Before create data privacy file, format excel should be following:</h1>
                <p>
                    1. Contain with header.
                </p>
                <p>
                    2. Contain with data.
                </p>
                <p>
                    3. The Excel should be converted to CSV format.
                </p>
                <p>
                    *Font which in the other languages from English might not be converted.
                </p>
            </div>
            <img src={excelImage} alt="Excel Illustration" />
            <div className="description-container">
                <h1>Alternative Method: Convert Excel to CSV Using Microsoft Excel</h1>
                <p>
                    You can manually convert an Excel file to a CSV format using Microsoft Excel. Here’s how.
                </p>
                <p>
                1. Open the Excel File.
                </p>
                <p>
                2. Prepare the Data
                Ensure that your data is correctly formatted.
                </p>
                <p>
                3. Save as CSV
                <p>
                Go to the File menu (or Office Button in older versions).
                Select Save As (or Export in some versions).
                </p>
                <p>
                In the Save As dialog box:
                </p>
                <p>
                Choose a location to save the file.
                In the Save as type dropdown, select CSV (Comma delimited) (*.csv).
                </p>
                <p>
                Enter a file name. {">"} Click Save.
                </p>
                </p>
            </div>

        </div>
    );
};

export default ExcelToCSVDownloader;
