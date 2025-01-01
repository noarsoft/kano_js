import React, { useState } from "react";
import Papa from "papaparse";
import Kano, { DataFrame } from "./Kano";

interface CSVRow {
  [key: string]: string | number;
}

function mapCSVRowsToDataFrame(csvRows: CSVRow[]): DataFrame {
  const dataFrame: DataFrame = {};

  if (csvRows.length === 0) {
    return dataFrame; // Return an empty DataFrame if no rows are provided
  }

  const columns = Object.keys(csvRows[0]);

  for (const column of columns) {
    dataFrame[column] = [];
  }

  for (const row of csvRows) {
    for (const column of columns) {
      dataFrame[column].push(row[column] || null);
    }
  }

  return dataFrame;
}

const CSVLoader: React.FC = () => {
  const [data, setData] = useState<CSVRow[]>([]);
  const [error, setError] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [executeData, setExecuteData] = useState<CSVRow[] | null>(null); // Data to pass to Kano
  const [k, setK] = useState<number>(2); // Default value of k is set to 2

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError("No file selected.");
      return;
    }

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          setError("Error parsing CSV file.");
          console.error(result.errors);
        } else {
          setError("");
          setData(result.data);

          // Extract numeric column names
          if (result.data.length > 0) {
            const numericColumns = Object.keys(result.data[0]).filter((key) =>
              result.data.every((row) => !isNaN(Number(row[key])))
            );
            setColumns(numericColumns);
          }
        }
      },
      error: (err) => {
        setError("Error reading file.");
        console.error(err);
      },
    });
  };

  const handleColumnSelection = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const handleExecute = () => {
    if (selectedColumns.length > 0) {
      const filteredData = data.map((row) =>
        Object.fromEntries(
          Object.entries(row).filter(([key]) => selectedColumns.includes(key))
        )
      );
      setExecuteData(filteredData); // Set data for Kano
    }
  };

  return (
    <div>

      <div className="description-container">
        <h1>Step to create data privacy</h1>
        <h3>1. Select K values = means atleast 2 (k=2) rows should be the same.</h3>
        <p>
          Ex. age 30, 31, 41, 42 {">"} to {">"} age 30-40, 30-40, 40-50, 40-50
        </p>
        <p>
          *Note: Some data might not be converted atleast 2 (k=2) rows.
        </p>
        <h3>2. Choose your csv files.</h3>
        <h3>The example data is <a>here</a></h3>
      </div>

      <div>
        <h2>Set K Value:</h2>
        <input
          type="number"
          value={k}
          onChange={(e) => setK(Number(e.target.value))}
          placeholder="Enter k value"
          style={{
            fontSize: "1.5rem",
            padding: "0.5rem",
          }}
        />
      </div>

      <h1>Select your CSV</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {error && <p style={{ color: "red" }}>{error}</p>}
      {data.length > 0 && (
        <div>
          <h2>Numeric Columns:</h2>
          <div>
            {columns.map((column) => (
              <div key={column}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column)}
                    onChange={() => handleColumnSelection(column)}
                  />
                  {column}
                </label>
              </div>
            ))}
          </div>
          <button onClick={handleExecute}>Execute</button>
        </div>
      )}

      {/* Pass data and selected columns to Kano */}
      {executeData && (
        <Kano
          df={mapCSVRowsToDataFrame(data)}
          selectedColumns={selectedColumns}
          k={k}
        />
      )}
    </div>
  );
};

export default CSVLoader;
