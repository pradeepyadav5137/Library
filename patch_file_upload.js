import fs from 'fs';

const filePath = 'frontend/src/pages/FileUpload.jsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `const isPaymentOptional = !isPaymentMandatory && requestCategory !== 'New'`,
  `const isPaymentOptional = !isPaymentMandatory && requestCategory !== 'New';\n  const isFirMandatory = requestCategory === 'Lost' || requestCategory === 'Stolen';`
);

content = content.replace(
  `{/* FIR Section (OPTIONAL) */}
          <h3>FIR / Lost Document Report (Optional)</h3>
          <div className="form-grid full">
            <div className="form-group">
              <label htmlFor="fir">
                FIR Copy / Lost Report
                <span className="optional"> (Optional)</span>
              </label>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                Required only if ID was lost or stolen. Upload FIR copy filed at police station.
              </p>`,
  `{/* FIR Section */}
          {(isFirMandatory || requestCategory !== 'New') && (
            <>
              <h3>FIR / Lost Document Report</h3>
              <div className="payment-instructions" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ color: '#1a365d', marginBottom: '10px' }}>FIR Registration Instructions</h4>
                <p style={{ marginBottom: '15px', fontSize: '14px' }}>Required if ID was lost or stolen.</p>
                <ol style={{ marginLeft: '20px', fontSize: '13px' }}>
                  <li>Example format: FIR No. 123/2023</li>
                  <li>Click below to go to TN Police Portal to register e-FIR for lost items if you haven't yet.</li>
                </ol>
                <button type="button" onClick={() => window.open('https://eservices.tnpolice.gov.in/CCTNSNICSDC/Index', '_blank')} className="btn btn-primary" style={{ marginTop: '15px' }}>Register FIR</button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="firNumber">FIR Number {isFirMandatory && <span className="required">*</span>}</label>
                  <input type="text" id="firNumber" name="firNumber" value={formData.firNumber || ''} onChange={(e) => setFormData(prev => ({ ...prev, firNumber: e.target.value }))} required={isFirMandatory} />
                </div>
                <div className="form-group">
                  <label htmlFor="firRegisteredDate">FIR Registered Date {isFirMandatory && <span className="required">*</span>}</label>
                  <input type="date" id="firRegisteredDate" name="firRegisteredDate" value={formData.firRegisteredDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, firRegisteredDate: e.target.value }))} required={isFirMandatory} />
                </div>
              </div>

              <div className="form-grid full">
                <div className="form-group">
                  <label htmlFor="fir">
                    FIR Copy / Lost Report {isFirMandatory ? <span className="required">*</span> : <span className="optional"> (Optional)</span>}
                  </label>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                    Upload FIR copy filed at police station.
                  </p>`
);


content = content.replace(
  `              <div className="form-grid full">
                <div className="form-group">
                  <label htmlFor="payment">
                    Fee Payment Receipt - ₹500 {isPaymentOptional ? <span className="optional">(Optional)</span> : <span className="required">*</span>}
                  </label>`,
  `              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="transactionNumber">Transaction Number {isPaymentMandatory && <span className="required">*</span>}</label>
                  <input type="text" id="transactionNumber" name="transactionNumber" value={formData.transactionNumber || ''} onChange={(e) => setFormData(prev => ({ ...prev, transactionNumber: e.target.value }))} required={isPaymentMandatory} />
                </div>
                <div className="form-group">
                  <label htmlFor="transactionDate">Transaction Date {isPaymentMandatory && <span className="required">*</span>}</label>
                  <input type="date" id="transactionDate" name="transactionDate" value={formData.transactionDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))} required={isPaymentMandatory} />
                </div>
              </div>
              <div className="form-grid full">
                <div className="form-group">
                  <label htmlFor="payment">
                    Fee Payment Receipt - ₹500 {isPaymentOptional ? <span className="optional">(Optional)</span> : <span className="required">*</span>}
                  </label>`
);

content = content.replace(
  `{files.fir && (`,
  `{files.fir && (`
);


// Replace close tags to make sure it matches
content = content.replace(
  `                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Payment Section (Mandatory for Student unless New) */}`,
  `                  </button>
                </div>
              )}
            </div>
          </div>
          </>
          )}

          {/* Payment Section (Mandatory for Student unless New) */}`
);



fs.writeFileSync(filePath, content);
