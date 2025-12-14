    import React, { useEffect, useState } from 'react';
    import api from '../Api';
    import '../assets/css.css'; // Ensure stall-cell and stall-row classes are in here

    const RentedStalls = () => {
        const [rentedStalls, setRentedStalls] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState('');

        useEffect(() => {
            const fetchRentedStalls = async () => {
                try {
                    const response = await api.get('/vendor/rented-stalls');
                    console.log(response.data.rented_stalls)
                    setRentedStalls(response.data.rented_stalls || []);
                } catch (err) {
                    console.error(err);
                    setError('Failed to fetch rented stalls.');
                } finally {
                    setLoading(false);
                }
            };

            fetchRentedStalls();
        }, []);

        if (loading) return <p>Loading rented stalls...</p>;
        if (error) return <p style={{ color: 'red' }}>{error}</p>;
        if (rentedStalls.length === 0) return <p>You have no rented stalls.</p>;

        // Optional grouping by section
        const groupedBySection = rentedStalls.reduce((acc, stall) => {
            const sectionName = stall.section?.name || 'Unknown Section';
            acc[sectionName] = acc[sectionName] || [];
            acc[sectionName].push(stall);
            return acc;
        }, {});

        return (
            <div className="stall-grid">
                <h2 style={{ marginBottom: '20px' }}>My Rented Stalls</h2>

                {Object.entries(groupedBySection).map(([section, stalls]) => (
                    <div key={section} style={{ marginBottom: '30px' }}>
                        <h3>{section}</h3>
                        <div className="stall-row" style={{ flexWrap: 'wrap' }}>
                            {stalls.map((stall, index) => (
                                <div
                                    key={`stall-${stall.id || `${stall.section?.id}-${stall.stall_number}-${index}`}`}
                                    className="stall-cell occupied"
                                    title={`Stall #${stall.stall_number}`}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        margin: '5px',
                                        fontWeight: 'bold',
                                        borderRadius: '4px',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                        cursor: 'default',
                                    }}
                                >
                                    #{stall.stall_number}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    export default RentedStalls;
