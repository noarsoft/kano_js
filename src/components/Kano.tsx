// Define data types
interface Row {
  [key: string]: number | string;
}

interface BinRanges {
  [key: string]: number[];
}

interface MaxMin {
  [key: string]: [number, number];
}

interface GroupedRow extends Row {
  Count: number;
}

function Kano() {
  // Generalize numerical data into ranges
  function generalizeColumn(data: number[], bins: number[]): (string | null)[] {
    const binLabels = bins.slice(0, -1).map((_, i) => `${bins[i]}-${bins[i + 1] - 1}`);
    return data.map(value => {
      for (let i = 0; i < bins.length - 1; i++) {
        if (value >= bins[i] && value < bins[i + 1]) {
          return binLabels[i];
        }
      }
      return null;
    });
  }

  // Group data by specified columns and count occurrences
  function groupByAndCount(data: Row[], groupColumns: string[]): GroupedRow[] {
    const groups: { [key: string]: GroupedRow } = {};
    data.forEach(row => {
      const key = groupColumns.map(col => row[col]).join("|");
      if (!groups[key]) {
        groups[key] = { ...row, Count: 0 } as GroupedRow;
      }
      groups[key].Count += 1;
    });
    return Object.values(groups);
  }

  // K-anonymity function
  function kAnonymize(
    data: Row[],
    listColumnsOrdinalInt: string[],
    listBinsColumnsOrdinalInt: BinRanges,
    k: number = 2
  ): GroupedRow[] {
    const generalizedData = data.map(row => {
      const newRow = { ...row };
      listColumnsOrdinalInt.forEach(column => {
        if (listBinsColumnsOrdinalInt[column]) {
          const generalizedValue = generalizeColumn([row[column] as number], listBinsColumnsOrdinalInt[column])[0];
          newRow[column] = generalizedValue!;
        }
      });
      return newRow;
    });

    // Group by specified columns and count occurrences
    const grouped = groupByAndCount(generalizedData, listColumnsOrdinalInt);

    // Filter groups with Count >= k
    return grouped.filter(group => group.Count >= k);
  }

  // Calculate the objective function
  function calculateObjectiveFunction(
    data: Row[],
    listColumnsOrdinalInt: string[],
    listBinsColumnsOrdinalInt: BinRanges
  ): number {
    let totalLoss = 0;

    data.forEach(row => {
      let rowLoss = 0;
      listColumnsOrdinalInt.forEach(column => {
        const bins = listBinsColumnsOrdinalInt[column];
        const U = bins[bins.length - 1];
        const L = bins[0];
        const value = row[column] as number;

        if (value >= bins[0] && value <= bins[bins.length - 1]) {
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
          throw new Error(`Value '${value}' in column '${column}' is out of range for bins.`);
        }
      });
      totalLoss += rowLoss;
    });

    let rowEquivalenceLoss = 0;
    for (let i = 0; i < data.length; i++) {
      for (let j = i + 1; j < data.length; j++) {
        if (listColumnsOrdinalInt.every(col => data[i][col] === data[j][col])) {
          rowEquivalenceLoss += 1;
        }
      }
    }

    return totalLoss + rowEquivalenceLoss;
  }

  // Check K-Anonymity
  function checkKAnonymity(data: Row[], listColumns: string[], k: number): [boolean, GroupedRow[]] {
    const grouped = groupByAndCount(data, listColumns);
    const satisfiesK = grouped.every(group => group.Count >= k);
    return [satisfiesK, grouped];
  }

  // Find max and min values
  function findMaxMin(data: Row[], columnList: string[]): MaxMin {
    const result: MaxMin = {};
    columnList.forEach(column => {
      const values = data.map(row => row[column] as number);
      result[column] = [Math.min(...values), Math.max(...values)];
    });
    return result;
  }

  // Create bins
  function createBins(listMaxMin: MaxMin, n: number): BinRanges {
    const listBins: BinRanges = {};
    Object.entries(listMaxMin).forEach(([column, [minVal, maxVal]]) => {
      const step = (maxVal - minVal) / n;
      listBins[column] = Array.from({ length: n + 1 }, (_, i) => minVal + i * step);
    });
    return listBins;
  }

  // Optimize bins
  function optimizeBins(
    data: Row[],
    listColumnsOrdinalInt: string[],
    maxIterations: number,
    maxBound: number
  ): void {
    const resultMaxMin = findMaxMin(data, listColumnsOrdinalInt);

    let n = 2;
    let times = 0;

    while (times < maxIterations && n <= maxBound) {
      const listBins = createBins(resultMaxMin, n);

      console.log(`== Optimization Step ${times}, n=${n} ==`);
      Object.entries(listBins).forEach(([column, bins]) => {
        console.log(`${column}: ${bins}`);
      });

      const objectiveValue = calculateObjectiveFunction(data, listColumnsOrdinalInt, listBins);
      console.log(`Objective Function Value for n=${n}: ${objectiveValue}\n`);

      n *= n;
      times += 1;
    }
  }

  // Sample dataset
  const data: Row[] = [
    { Age: 25, Gender: "Male", Zipcode: 12345, Income: 40000 },
    { Age: 30, Gender: "Female", Zipcode: 12346, Income: 45000 },
    { Age: 35, Gender: "Female", Zipcode: 12345, Income: 50000 },
    { Age: 40, Gender: "Male", Zipcode: 12347, Income: 55000 },
    { Age: 45, Gender: "Male", Zipcode: 12346, Income: 60000 },
    { Age: 50, Gender: "Female", Zipcode: 12345, Income: 65000 },
    { Age: 55, Gender: "Female", Zipcode: 12347, Income: 70000 },
    { Age: 60, Gender: "Male", Zipcode: 12346, Income: 75000 },
  ];

  const listColumnsOrdinalInt = ["Age", "Income"];
  const listBins: BinRanges = {
    Age: [0, 30, 40, 50, 60, 70],
    Income: [0, 50000, 60000, 70000, 80000],
  };

  // Run optimization
  optimizeBins(data, listColumnsOrdinalInt, 10, 10000);

  // Check K-anonymity
  const k = 2;
  const anonymizedData = kAnonymize(data, listColumnsOrdinalInt, listBins, k);
  console.log("\nAnonymized Data (k-anonymity):", anonymizedData);

  const [satisfiesK, groupedSummary] = checkKAnonymity(data, listColumnsOrdinalInt, k);
  console.log(`Does the data satisfy k-anonymity (k=${k})? ${satisfiesK}`);
  console.log("Grouped Summary:", groupedSummary);

  return (
    <>
      <div>Kano</div>
    </>
  )
}

export default Kano