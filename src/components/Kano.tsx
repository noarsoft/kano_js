import React, { useEffect, useState } from "react";

// interface MinMax {
//   min: number;
//   max: number;
// }

type BinMapping = { [column: string]: number[] };
export type DataFrame = { [key: string]: any[] }; // Represents a DataFrame as a column-oriented object

function generalizeColumn(data: number[], bins: number[]): string[] {
  const binLabels = bins.slice(0, -1).map((bin, i) => `${bin}-${bins[i + 1] - 1}`);
  return data.map((value) => {
    for (let i = 0; i < bins.length - 1; i++) {
      if (value >= bins[i] && value < bins[i + 1]) {
        return binLabels[i];
      }
    }
    return "Out of Range"; // Handle values outside defined bins
  });
}

function kAnonymize(
  df: DataFrame,
  listColumnsOrdinalInt: string[],
  listBinsColumnsOrdinalInt: BinMapping,
): DataFrame {
  // console.log("listBinsColumnsOrdinalInt", listBinsColumnsOrdinalInt)
  // Ensure the selected columns are in the DataFrame
  for (const column of listColumnsOrdinalInt) {
    if (!(column in df)) {
      throw new Error(`Column '${column}' is not in the DataFrame.`);
    }
  }

  // Generalize only the specified columns using their respective bins
  const generalizedDf: DataFrame = {};
  for (const column in df) {
    generalizedDf[column] = df[column]; // Copy non-selected columns as is
    if (listColumnsOrdinalInt.includes(column)) {
      generalizedDf[column] = generalizeColumn(df[column], listBinsColumnsOrdinalInt[column]);
    }
  }

  return generalizedDf;

  // // Group by quasi-identifiers and count occurrences
  // const grouped = groupByColumnAndAddCount(generalizedDf, listColumnsOrdinalInt);
  // return grouped;
}


function groupByColumnAndAddCount(df: DataFrame, groupByColumns: string[]): DataFrame {
  const groupedCounts: { [key: string]: { [key: string]: any; _count: number } } = {};
  const result: DataFrame = Object.fromEntries(
    [...groupByColumns, "_count"].map((col) => [col, []])
  ) as DataFrame;

  const rowCount = df[groupByColumns[0]].length;

  // Group rows by specified columns
  for (let i = 0; i < rowCount; i++) {
    const key = groupByColumns.map((col) => df[col][i]).join("|");
    if (!groupedCounts[key]) {
      groupedCounts[key] = {
        ...Object.fromEntries(groupByColumns.map((col) => [col, df[col][i]])),
        _count: 0
      };
    }
    groupedCounts[key]._count += 1;
  }

  // Populate the result DataFrame
  for (const key in groupedCounts) {
    groupByColumns.forEach((col) => result[col].push(groupedCounts[key][col]));
    result["_count"].push(groupedCounts[key]._count);
  }

  return result;
}

function checkKAnonymity(
  generalizedDf: DataFrame,
  listColumns: string[],
  k: number
): boolean {

  const listColumnsOrdinalInt = listColumns;
  const grouped = groupByColumnAndAddCount(generalizedDf, listColumnsOrdinalInt);
  const Count = grouped["_count"];
  const satisfiesK = Count.every((count) => count >= k);
  return satisfiesK;
}

function createBinsForColumn(df: DataFrame, column: string, numBins: number): number[] {
  if (!df[column] || df[column].length === 0) {
    throw new Error(`Column '${column}' does not exist or contains no data.`);
  }
  if (numBins < 1) {
    throw new Error("Number of bins must be at least 1.");
  }

  const data = df[column] as number[]; // Ensure the column data is numeric
  const min = Math.min(...data);
  const max = Math.max(...data) + 1; // Include the upper boundary

  // Check if min and max are too close
  if (max - min < 1) {
    throw new Error(`Range too small to create meaningful bins for column '${column}'.`);
  }

  const binSize = Math.ceil((max - min) / numBins); // Round up bin size to ensure integer intervals

  // Generate bins with consistent intervals
  const bins: number[] = [];
  for (let i = 0; i <= numBins; i++) {
    bins.push(Math.round(min + binSize * i));
  }

  // Ensure bins are unique and sorted
  return Array.from(new Set(bins)).sort((a, b) => a - b);
}

function hasSequentialNumbers(list: number[]): boolean {
  if (list.length < 2) {
    return false; // A single number or empty list can't be sequential
  }

  for (let i = 1; i < list.length; i++) {
    if (list[i] - list[i - 1] === 1) {
      return true; // Found sequential numbers
    }
  }

  return false; // No sequential numbers found
}


function calculateObjectiveFunction(
  df: DataFrame,
  listColumnsOrdinalInt: string[],
  listBinsColumnsOrdinalInt: BinMapping
): number {
  let totalLoss = 0;

  // D_i,j (Degree of Information Loss)
  for (let rowIndex = 0; rowIndex < df[listColumnsOrdinalInt[0]].length; rowIndex++) {
    let rowLoss = 0;

    for (const column of listColumnsOrdinalInt) {
      if (column in listBinsColumnsOrdinalInt) {
        const bins = listBinsColumnsOrdinalInt[column];
        const U = bins[bins.length - 1];
        const L = bins[0];

        const value = df[column][rowIndex];

        // Check if the column value lies within the bin range
        if (value >= L && value <= U) {
          // Identify the bin index
          for (let i = 0; i < bins.length - 1; i++) {
            if (value >= bins[i] && value < bins[i + 1]) {
              const lowerBound = bins[i];
              const upperBound = bins[i + 1];
              const loss = (upperBound - lowerBound) / (U - L);
              rowLoss += loss;
              break;
            }
          }
        } else {
          throw new Error(
            `Value '${value}' in column '${column}' is out of range for bins.`
          );
        }
      }
    }

    totalLoss += rowLoss;
  }

  // W_i,l (Row equivalence loss)
  let rowEquivalenceLoss = 0;
  for (let i = 0; i < df[listColumnsOrdinalInt[0]].length; i++) {
    for (let j = i + 1; j < df[listColumnsOrdinalInt[0]].length; j++) {
      if (
        listColumnsOrdinalInt.every(
          (col) => df[col][i] === df[col][j]
        )
      ) {
        rowEquivalenceLoss += 1;
      }
    }
  }

  // Final Objective Function value
  const objectiveValue = totalLoss + rowEquivalenceLoss;
  return objectiveValue;
}


//strategy 1 column
function getSatifiedKBins(
  df: DataFrame,
  selectColumn: string,
  max_times: number = 10,
  k: number = 2
) {
  let init_numBins: number = 1; // Start from 1

  const listOfNumBinsSatisfiesK: number[] = [];
  for (let i = 0; i < max_times; i++) {
    const listBinsColumnsOrdinalInt: BinMapping = {};

    try {
      const bins = createBinsForColumn(df, selectColumn, init_numBins);
      listBinsColumnsOrdinalInt[selectColumn] = bins;

      if (hasSequentialNumbers(listBinsColumnsOrdinalInt[selectColumn])) {
        return listOfNumBinsSatisfiesK;
      } else {
        const anonymized = kAnonymize(
          df,
          [selectColumn],
          listBinsColumnsOrdinalInt
        );
        // console.log(anonymized);

        const satisfiesK = checkKAnonymity(anonymized, [selectColumn], k);
        // const objectiveValue = calculateObjectiveFunction(
        //   df,
        //   [selectColumn],
        //   listBinsColumnsOrdinalInt
        // );
        // console.log("loss value", objectiveValue);

        if (satisfiesK) {
          listOfNumBinsSatisfiesK.push(init_numBins);
        } else {
          return listOfNumBinsSatisfiesK;
        }

        init_numBins *= 2; // Increase the number of bins exponentially
      }
    } catch (error) {
      // Handle cases where creating bins fails
      console.log(error);
      return listOfNumBinsSatisfiesK;
    }
  }

  return listOfNumBinsSatisfiesK;
}

//strategy 1 columns
function getSatifiedKBinsMultiColumns(df: DataFrame, selectColumns: string[], max_times: number = 10, k: number = 2) {

  const listOfSatisfiedBins: DataFrame = {}; //satifaction divided bins of single column
  for (let column of selectColumns) {
    const listSatisfiedBins = getSatifiedKBins(df, column, max_times, k);
    listOfSatisfiedBins[column] = listSatisfiedBins;
  }

  console.log(listOfSatisfiedBins);

  //find k  match list of good bins from move i,j,k,.. left to right
  let keys_column = Object.keys(listOfSatisfiedBins);
  
  const listBinsColumnsOrdinalInt: BinMapping = {};
  for (let column of keys_column) {
    const bins = createBinsForColumn(df, column, 1);
    listBinsColumnsOrdinalInt[column] = [];
    for (let index = 0; index < bins.length; index++) {
      
      listBinsColumnsOrdinalInt[column].push(bins[index])
    }
    
  }

  console.log(listBinsColumnsOrdinalInt);

  let prev_listBinsColumnsOrdinalInt: BinMapping = {};
  prev_listBinsColumnsOrdinalInt = JSON.parse(JSON.stringify(listBinsColumnsOrdinalInt));
  //find best group of column
  //listRunningBins -> [0,0,0,..] = [index_step_of_col1, index_step_of_col2, ...]
  for (let index = 0; index < keys_column.length; index++) {
    const column =  keys_column[index];
    console.log(column);
    let can_move = true;
    let i = 0;
    while(can_move)
    {
      // console.log(listOfSatisfiedBins)
      let bin_number =  listOfSatisfiedBins[column][i];
      // console.log("bin_number",column)
      // console.log(bin_number)
      const bins = createBinsForColumn(df, column, bin_number);
      const anonymized = kAnonymize(df, keys_column, listBinsColumnsOrdinalInt);
      const grouped = groupByColumnAndAddCount(anonymized, keys_column);
      console.log(grouped);
      console.log(listBinsColumnsOrdinalInt);
      console.log(prev_listBinsColumnsOrdinalInt);
      
      // for (let count_row of grouped["_count"]) {
      //   // console.log(count_row);
      //   if(count_row < k){
      //     can_move = false;
      //   }
      // }
      // if(!can_move)
      // {
      //   break;
      //   can_move = true;
      // }
      // console.log(grouped);

      const satisfiesK = checkKAnonymity(anonymized, keys_column, k);
      console.log(satisfiesK);
      
      if(satisfiesK)
      {
        prev_listBinsColumnsOrdinalInt = JSON.parse(JSON.stringify(listBinsColumnsOrdinalInt));
      }

      if(!satisfiesK || i > listOfSatisfiedBins[column].length-1 || bin_number === undefined)
      {
        can_move = false;
        break        
      }
      // const listBinsColumnsOrdinalInt: BinMapping = { age: [0, 30, 40, 50, 60],... };
      listBinsColumnsOrdinalInt[column] = bins;

      

      i = i + 1;
    }
    can_move = true;
  }
  return prev_listBinsColumnsOrdinalInt;
}


// function testFunctions(): void {
//   // Test generalizeColumn
//   // const data = [25, 35, 45, 55, 65];
//   // const bins = [0, 30, 40, 50, 60, 70];
//   // const generalizedData = generalizeColumn(data, bins);
//   // console.log("Test generalizeColumn:");
//   // console.log("Input:", data);
//   // console.log("Bins:", bins);
//   // console.log("Output:", generalizedData);
//   // console.log(
//   //     JSON.stringify(generalizedData) === JSON.stringify(["0-29", "30-39", "40-49", "50-59", "60-69"])
//   // );

//   // Test groupByAndCount
//   const df: DataFrame = {
//     age: [25, 25, 35, 35, 45],
//     income: [50000, 50000, 60000, 65000, 70000]
//   };
//   const grouped = groupByColumnAndAddCount(df, ["age", "income"]);
//   console.log("\nTest groupByColumnAndAddCount:");
//   console.log("Input DataFrame:", df);
//   console.log("Grouped Result:", grouped);

//   // Test kAnonymize
//   const listColumnsOrdinalInt = ["age"];
//   const listBinsColumnsOrdinalInt: BinMapping = { age: [0, 30, 40, 50, 60] };
//   const k = 2;
//   const anonymized = kAnonymize(df, listColumnsOrdinalInt, listBinsColumnsOrdinalInt, k);
//   console.log("\nTest kAnonymize:");
//   console.log("Input DataFrame:", df);
//   console.log("Anonymized DataFrame:", anonymized);
//   const grouped1 = groupByColumnAndAddCount(anonymized, listColumnsOrdinalInt);
//   console.log("Group Anonymized DataFrame ([age]):", grouped1);
//   const listColumnsOrdinalInt2 = ["age", "income"];
//   const grouped2 = groupByColumnAndAddCount(anonymized, listColumnsOrdinalInt2);
//   console.log("Group Anonymized DataFrame ([age,income]):", grouped2);

//   // Test checkKAnonymity
//   const satisfiesK = checkKAnonymity(anonymized, ["age"], k);
//   console.log("\nTest checkKAnonymity:");
//   console.log("Input DataFrame:", anonymized);
//   console.log("Satisfies k-anonymity:", satisfiesK);
//   console.log(satisfiesK === true);


//   const column = "age";
//   const numBins = 3;
//   console.log("Bins for column 'age':", createBinsForColumn(df, column, numBins));

// }

// function testGetSatifiedKBins() {
//   // Sample DataFrame
//   const df: DataFrame = {
//     age: [25, 25, 35, 35, 45, 45, 55, 55, 65, 65], // Repeated values for k-anonymity
//     income: [50000, 50000, 60000, 60000, 70000, 70000, 80000, 80000, 90000, 90000]
//   };

//   const selectColumn = "age";
//   const max_times = 10;
//   const k = 2;

//   console.log("Testing getSatifiedKBins...");
//   const result = getSatifiedKBins(df, selectColumn, max_times, k);

//   console.log("Input DataFrame:", df);
//   console.log(`Column: ${selectColumn}`);
//   console.log(`Max Times: ${max_times}`);
//   console.log(`K: ${k}`);
//   console.log("Result:", result);

//   // Expecting bins that satisfy k-anonymity for the given column
//   console.log("Test passed!");
// }

// function testGetSatifiedKBins2() {
//   // Sample DataFrame
//   const df: DataFrame = {
//     age: [25, 25, 35, 35, 45, 45, 55, 55, 65, 65], // Repeated values for k-anonymity
//     income: [50000, 50000, 60000, 60000, 70000, 70000, 80000, 80000, 90000, 90000]
//   };

//   const max_times = 10;
//   const k = 2;

//   const listBinsColumnsOrdinalInt: BinMapping = getSatifiedKBinsMultiColumns(df, ["age","income"], max_times, k);
  
//   const anonymized = kAnonymize(df, ["age","income"], listBinsColumnsOrdinalInt);
  
//   const objectiveValue = calculateObjectiveFunction(
//     df,
//     ["age","income"],
//     listBinsColumnsOrdinalInt
//   );

//   const grouped = groupByColumnAndAddCount(anonymized,  ["age","income"]);
//   console.log(objectiveValue);
//   console.log(anonymized);
//   console.log(grouped);
//   // const satisfiesK = checkKAnonymity(anonymized, keys_column, k);
  

  

//   console.log("Test passed!");
// }

function processAnonymization(
  df: DataFrame,
  selectedColumns: string[],
  k: number,
  maxTimes: number = 10
): any {
  // Step 1: Get k-anonymity bins
  const listBinsColumnsOrdinalInt: BinMapping = getSatifiedKBinsMultiColumns(
    df,
    selectedColumns,
    maxTimes,
    k
  );

  // Step 2: Perform k-anonymization
  const anonymized = kAnonymize(df, selectedColumns, listBinsColumnsOrdinalInt);

  // Step 3: Calculate the objective value
  const objectiveValue = calculateObjectiveFunction(
    df,
    selectedColumns,
    listBinsColumnsOrdinalInt
  );

  // Step 4: Group the anonymized data by columns and count
  const grouped = groupByColumnAndAddCount(anonymized, selectedColumns);

  return {
    anonymized,
    grouped,
    objectiveValue,
  };
}

// testFunctions()
// testGetSatifiedKBins()
// testGetSatifiedKBins2()




interface KanoProps {
  df: DataFrame;
  selectedColumns: string[];
  k?: number; // Optional, defaults to 2
}

const Kano: React.FC<KanoProps> = ({ df, selectedColumns, k = 2 }) => {

  const [anonymizedData, setAnonymizedData] = useState<DataFrame | null>(null);
  const [groupedData, setGroupedData] = useState<DataFrame | null>(null);
  const [objectiveValue, setObjectiveValue] = useState<number | null>(null);

  useEffect(() => {
    if (df && selectedColumns.length > 0) {
      const { anonymized, grouped, objectiveValue } = processAnonymization(df, selectedColumns, k);
      setAnonymizedData(anonymized);
      setGroupedData(grouped);
      setObjectiveValue(objectiveValue);
    }
  }, [df, selectedColumns, k]);

  const renderTable = (data: DataFrame) => {
    const columns = Object.keys(data);
    const rows = Object.values(data)[0]?.length || 0;

    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderWidth:"1px", borderStyle: "solid", borderColor:"#ffffff", borderCollapse: "collapse", width: "100%", minWidth: "800px" }}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} style={{ color:'black', padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2" }}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex} style={{ borderWidth:"1px", borderStyle: "solid", borderColor:"#ffffff",padding: "8px", textAlign: "left" }}>
                    {data[column][rowIndex]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }
  
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(","));
  
    data.forEach(row => {
      const values = headers.map(header => `"${row[header]}"`);
      csvRows.push(values.join(","));
    });
  
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isArray = (data: unknown): data is any[] => Array.isArray(data);

  return (
    <div>
      <h1>K-Anonymization Results</h1>
      <h2>Selected Columns:</h2>
      <p>{selectedColumns.join(", ")}</p>
      <h2>K-Value:</h2>
      <p>{k}</p>
      <h2>Degree of infomation loss:</h2>
      <p>{objectiveValue}</p>
      <h2>Anonymized Data:</h2>
      <button
        onClick={() =>
          isArray(anonymizedData) && exportToCSV(anonymizedData, "anonymizedData")
        }
      >
        Export Anonymized Data
      </button>

      {anonymizedData ? renderTable(anonymizedData) : <p>No data available</p>}
      
      <h2>Grouped Data:</h2>

      <button
        onClick={() =>
          isArray(groupedData) && exportToCSV(groupedData, "groupedData")
        }
      >
        Export Grouped Data
      </button>

      {groupedData ? renderTable(groupedData) : <p>No data available</p>}
      
    </div>
  );
};

export default Kano;
