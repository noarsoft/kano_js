# Steps to Create Data Privacy with K-Anonymization

### 1. Select K Value
- **Definition**: The K value ensures at least `k` rows in the dataset have identical quasi-identifiers after anonymization.
- **Example**: 
  - Original data:
    ```
    age: 30, 31, 41, 42
    ```
  - Anonymized data with `k=2`:
    ```
    age: 30-40, 30-40, 40-50, 40-50
    ```

*Note*: Some data may not satisfy the `k` condition, depending on the dataset structure.

---

### 2. Choose Your CSV File
- **Upload**: Select the CSV file containing the dataset to be anonymized.
- **Columns**: Identify the quasi-identifiers (columns to be anonymized).

---

### Learn More
Visit [Create Data Privacy Tools](https://noarsoft.github.io/) for more resources and tools to enhance data privacy.


# Code Overview: K-Anonymization

This code implements K-Anonymization functionality in React, including bin creation, data generalization, information loss calculation, and a UI component for displaying and exporting results. Below is a breakdown of the functionality:

## Core Functions

### Generalization
- **`generalizeColumn(data: number[], bins: number[]): string[]`**
  - Maps numeric values into predefined bins and assigns labels like `0-29`.

### K-Anonymization
- **`kAnonymize(df: DataFrame, listColumnsOrdinalInt: string[], listBinsColumnsOrdinalInt: BinMapping): DataFrame`**
  - Applies generalization to specified columns using provided bins.

### Grouping and Counting
- **`groupByColumnAndAddCount(df: DataFrame, groupByColumns: string[]): DataFrame`**
  - Groups rows by selected columns and counts occurrences.

### K-Anonymity Check
- **`checkKAnonymity(generalizedDf: DataFrame, listColumns: string[], k: number): boolean`**
  - Verifies whether the data satisfies K-Anonymity.

### Bin Creation
- **`createBinsForColumn(df: DataFrame, column: string, numBins: number): number[]`**
  - Divides numeric data into bins based on the specified number of bins.

### Information Loss Calculation
- **`calculateObjectiveFunction(df: DataFrame, listColumnsOrdinalInt: string[], listBinsColumnsOrdinalInt: BinMapping): number`**
  - Calculates information loss and row equivalence loss.

### Bin Optimization
- **`getSatifiedKBins(df: DataFrame, selectColumn: string, max_times: number, k: number): number[]`**
  - Finds bins that satisfy K-Anonymity for a single column.
- **`getSatifiedKBinsMultiColumns(df: DataFrame, selectColumns: string[], max_times: number, k: number): BinMapping`**
  - Optimizes bins for multiple columns to meet K-Anonymity.

## Utility Functions
- **`exportToCSV(data: any[], filename: string)`**
  - Exports data to a CSV file.

## React Component: `Kano`
### Props
- **`df: DataFrame`** - Input data in column-oriented format.
- **`selectedColumns: string[]`** - Columns to anonymize.
- **`k: number`** *(Optional)* - Minimum K-Anonymity value (default: 2).

### State
- **`anonymizedData`** - Resulting anonymized dataset.
- **`groupedData`** - Grouped data after anonymization.
- **`objectiveValue`** - Calculated information loss.

### Features
- Renders tables for anonymized and grouped data.
- Allows data export to CSV.
- Dynamically updates based on `df`, `selectedColumns`, and `k`.

### Example UI Structure
- **Selected Columns**
- **K-Value**
- **Degree of Information Loss**
- **Anonymized Data Table**
- **Grouped Data Table**
- **Export Buttons**

---
