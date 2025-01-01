import React from "react";
import "./KAnonymityDescription.css";

const KAnonymityDescription: React.FC = () => {
  return (
    <div className="description-container">
      <h1>What is K-Anonymity?</h1>
      <p>
        <strong>K-Anonymity</strong> is a privacy-preserving technique used in data anonymization to ensure
        that individuals cannot be uniquely identified in a dataset. The key idea is to modify the data in
        such a way that each record is indistinguishable from at least <em>k - 1</em> other records based on
        a set of quasi-identifiers.
      </p>

      <h2>Key Concepts</h2>
      <ul>
        <li>
          <strong>Quasi-Identifiers</strong>: Attributes like age, gender, and zip code that, when combined,
          can identify individuals.
        </li>
        <li>
          <strong>Generalization</strong>: Reducing the granularity of data (e.g., grouping ages into ranges like
          "20-30 years").
        </li>
        <li>
          <strong>Suppression</strong>: Masking or removing specific data values to prevent identification.
        </li>
        <li>
          <strong>K-Value</strong>: A parameter that defines the level of anonymity. For example, if k=2, each
          record must share its quasi-identifiers with at least one other record.
        </li>
      </ul>

      <h2>How It Works</h2>
      <ol>
        <li>Identify quasi-identifiers that could potentially reveal identities.</li>
        <li>
          Apply generalization and suppression to ensure each combination of quasi-identifiers appears in at least <em>k</em> records.
        </li>
        <li>Validate the dataset to ensure it satisfies the k-anonymity property.</li>
      </ol>

      <h2>Example</h2>
      <p>Here’s an example of how k-anonymity works:</p>
      <p><strong>Original Dataset:</strong></p>
      <div className="example-box">
        <pre>{`
Age    Gender   Zip Code   Disease
27     Male     12345      Flu
29     Male     12346      Cold
28     Female   12345      Diabetes
35     Male     12347      Hypertension
36     Female   12346      Cancer
        `}</pre>
      </div>
      <p><strong>After Applying 2-Anonymity:</strong></p>
      <div className="example-box">
        <pre>{`
Age      Gender   Zip Code   Disease
20-30   Male     1234X      Flu
20-30   Male     1234X      Cold
20-30   Female   1234X      Diabetes
30-40   Male     1234X      Hypertension
30-40   Female   1234X      Cancer
        `}</pre>
      </div>

      <h2>Benefits</h2>
      <ul>
        <li>Prevents re-identification of individuals in datasets.</li>
        <li>Balances data utility with privacy protection.</li>
      </ul>

      <h2>Applications</h2>
      <ul>
        <li>Healthcare: Protecting patient privacy in medical records.</li>
        <li>E-commerce: Safeguarding customer data.</li>
        <li>Government: Publishing anonymized census data.</li>
      </ul>

      <p className="footer">
        K-anonymity is an essential tool for maintaining privacy in data sharing and analysis. By ensuring
        that individuals cannot be uniquely identified, organizations can securely share data while respecting
        privacy regulations.
      </p>
    </div>
  );
};

export default KAnonymityDescription;
