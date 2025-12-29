import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";
import './Reports_Printing.css'; // Path ensure karein ki sahi hai

const Reports_Printing = () => {
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [category, setCategory] = useState("sales"); 
    const [productFilter, setProductFilter] = useState("All");
    const [selectedPerson, setSelectedPerson] = useState("All"); 
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]); 
    const [personList, setPersonList] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    const productCategories = ["Corn Grit", "Corn Flour", "Cattle Feed", "Rice Grit", "Rice Flour", "Packing Bag"];

    // 1️⃣ Data Fetching (MySQL API Call)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Backend URL check karein (Port 5000)
                const response = await axios.get(`http://localhost:5000/api/reports/${category}`);
                const data = response.data || [];
                
                setRawData(data);
                setFilteredData([]); // Naya category aane par purana filter hata dein
                
                // Party list update karein (Sirf sales/purchase ke liye)
                if (category !== "stock") {
                    const names = category === "sales" 
                        ? [...new Set(data.map(item => item.customer_name))]
                        : [...new Set(data.map(item => item.supplier_name))];
                    setPersonList(names.filter(Boolean));
                } else {
                    setPersonList([]);
                }
            } catch (err) {
                console.error("Fetch Error:", err);
                setRawData([]);
                setSnackbar({ open: true, message: "Database connection failed!", severity: "error" });
            } finally {
                setProductFilter("All");
                setSelectedPerson("All");
                setLoading(false);
            }
        };

        fetchData();
    }, [category]);

    // 2️⃣ Handle Filter Logic
    const handleFilter = () => {
        // Stock ke liye date zaroori nahi, baaki ke liye selection zaroori hai
        if (category !== "stock" && selectedPerson === "All" && productFilter === "All" && !startDate) {
            setSnackbar({ open: true, message: "Please apply at least one filter!", severity: "warning" });
            return;
        }

        let temp = [...rawData];

        // Date Range (MySQL formats usually YYYY-MM-DD)
        if (startDate && endDate) {
            temp = temp.filter(item => {
                const itemDate = (item.created_at || item.date || "").split('T')[0];
                return itemDate >= startDate && itemDate <= endDate;
            });
        }

        // Product Filter
        if (productFilter !== "All") {
            temp = temp.filter(item => (item.product_name || item.name) === productFilter);
        }
        
        // Party/Person Filter
        if (category !== "stock" && selectedPerson !== "All") {
            temp = temp.filter(item => 
                (item.customer_name === selectedPerson) || (item.supplier_name === selectedPerson)
            );
        }

        setFilteredData(temp);
        setSnackbar({ open: true, message: `${temp.length} records found.`, severity: "success" });
    };

    const calculateTotal = () => {
        return filteredData.reduce((sum, item) => sum + (Number(item.total_amount || item.amount || 0)), 0);
    };

    return (
        <div className="reports-full-screen">
            {loading && <Loader />}
            
            <div className="report-controls no-print">
                <h2 className="table-title">🖨️ Business Report Center</h2>
                <div className="report-form-grid">
                    <div className="input-group">
                        <label>1. Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="sales">Sales (Bikri)</option>
                            <option value="purchases">Purchases (Kharid)</option>
                            <option value="stock">Current Stock</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>2. Product Name</label>
                        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
                            <option value="All">All Items</option>
                            {productCategories.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    {category !== "stock" && (
                        <div className="input-group">
                            <label>3. Party/Person Name</label>
                            <select value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
                                <option value="All">-- Select Party --</option>
                                {personList.map((name, i) => <option key={i} value={name}>{name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="input-group">
                        <label>4. Date Range</label>
                        <div style={{display: 'flex', gap: '5px'}}>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="report-actions">
                    <button className="btn-filter" onClick={handleFilter}>🔍 Show Data</button>
                    <button className="btn-print-main" onClick={() => window.print()}>🖨️ Print Report</button>
                </div>
            </div>

            {/* PRINTABLE AREA */}
            <div className="printable-invoice A4">
                <div className="invoice-header only-print">
                    <div className="company-info-center">
                        <h1>DHARA SHAKTI AGRO PRODUCTS</h1>
                        <p className="manufacture-line">Quality Manufacturers of Corn Grits & Cattle Feed</p>
                        <p style={{textTransform: 'uppercase'}}>GSTIN: 10DZTPM1457E1ZE | {category} REPORT</p>
                    </div>
                </div>

                <table className="modern-report-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Party Name</th>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((item, index) => (
                                <tr key={item.id || index}>
                                    <td>{item.date ? new Date(item.date).toLocaleDateString('en-IN') : "N/A"}</td>
                                    <td>{item.customer_name || item.supplier_name || "Internal"}</td>
                                    <td>{item.product_name || item.name}</td>
                                    <td>{item.quantity || item.stock_quantity || 0}</td>
                                    <td className="text-right">₹{Number(item.total_amount || item.amount || 0).toLocaleString('en-IN')}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{textAlign: 'center', padding: '40px', color: '#888'}}>
                                    No records to display. Select filters and click "Show Data".
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {filteredData.length > 0 && (
                        <tfoot>
                            <tr className="grand-total-row">
                                <td colSpan="4" style={{textAlign: 'right'}}><strong>GRAND TOTAL (Settle Amount):</strong></td>
                                <td className="text-right"><strong>₹{calculateTotal().toLocaleString('en-IN')}</strong></td>
                            </tr>
                        </tfoot>
                    )}
                </table>

                <div className="invoice-footer-pro only-print">
                    <div className="signature-grid">
                        <div className="sign-box"><p>Accountant Sign</p></div> 
                        <div className="sign-box"><p>Authorized Signatory</p></div>
                    </div>
                </div>
            </div>

            <CustomSnackbar 
                open={snackbar.open} 
                message={snackbar.message} 
                severity={snackbar.severity} 
                onClose={() => setSnackbar({ ...snackbar, open: false })} 
            />
        </div>
    );
};

export default Reports_Printing;