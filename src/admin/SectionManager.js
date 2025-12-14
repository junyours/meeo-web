import React, { useEffect, useState } from "react";
import { Button, Input, Modal, Select, Form, message } from "antd";
import api from "../Api";
import StallGrid from "./StallGrid";
import LoadingOverlay from "./Loading"; // ✅ logo-based loader
import "./SectionManager.css";

const { Option } = Select;

const SectionManager = () => {
  const [areas, setAreas] = useState([]);
  const [editMode, setEditMode] = useState(false);

  // ✅ Global loader
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  // Add Area
  const [showAddAreaForm, setShowAddAreaForm] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [areaColumns, setAreaColumns] = useState("");
  const [rowsPerColumn, setRowsPerColumn] = useState([]);

  // Add Section
  const [showAddSectionForm, setShowAddSectionForm] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [rateType, setRateType] = useState("");
  const [rate, setRate] = useState("");
  const [monthlyRate, setMonthlyRate] = useState("");

  // Edit Section
  const [showEditSectionForm, setShowEditSectionForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  // Add Stalls
  const [showStallModal, setShowStallModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [rowCount, setRowCount] = useState("");
  const [columnsPerRow, setColumnsPerRow] = useState([]);
  const [stallSize, setStallSize] = useState("");

  // ✅ NEW: single stall placement
  const [pendingStallData, setPendingStallData] = useState(null);

  // ✅ Fetch Areas
  const fetchAreas = async () => {
    try {
      setLoadingMessage("Fetching Market Layout...");
      setLoading(true);

      const response = await api.get("/areas");
      const dataWithVacancies = response.data.data.map((area) => {
        const rowsPerCol =
          area.rows_per_column ||
          Array(area.column_count).fill(area.row_count);

        let vacancies = [];
        rowsPerCol.forEach((rowCount, colIdx) => {
          for (let r = 0; r < rowCount; r++) {
            vacancies.push({
              id: `vacant-${colIdx + 1}-${r + 1}`,
              section:
                area.sections?.find(
                  (s) => s.column_index === colIdx && s.row_index === r
                ) || null,
            });
          }
        });

        return { ...area, rows_per_column: rowsPerCol, vacancies };
      });
      console.log(response.data.data)
      setAreas(dataWithVacancies);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch areas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  // Handlers for inputs
  const handleColumnsChange = (value) => {
    setAreaColumns(value);
    setRowsPerColumn(Array.from({ length: parseInt(value) || 0 }, () => ""));
  };

  const handleRowChange = (colIndex, value) => {
    const updated = [...rowsPerColumn];
    updated[colIndex] = value;
    setRowsPerColumn(updated);
  };

  const handleRowCountChange = (value) => {
    setRowCount(value);
    setColumnsPerRow(Array.from({ length: parseInt(value) || 0 }, () => ""));
  };

  const handleColumnsPerRowChange = (rowIndex, value) => {
    const updated = [...columnsPerRow];
    updated[rowIndex] = value;
    setColumnsPerRow(updated);
  };

  // ✅ Add Area
  const handleAddArea = async () => {
    if (!newAreaName || !areaColumns || rowsPerColumn.some((r) => !r)) {
      return message.warning("All fields required.");
    }

    setLoadingMessage("Saving New Area...");
    setLoading(true);
    try {
      const response = await api.post("/areas", {
        name: newAreaName,
        column_count: areaColumns,
        rows_per_column: rowsPerColumn,
      });

      const createdArea = response.data.data;
      const vacancies = [];
      rowsPerColumn.forEach((rowCount, colIdx) => {
        for (let r = 0; r < rowCount; r++) {
          vacancies.push({
            id: `vacant-${colIdx + 1}-${r + 1}`,
            section: null,
          });
        }
      });

      setAreas([
        ...areas,
        {
          ...createdArea,
          sections: [],
          vacancies,
          rows_per_column: rowsPerColumn,
        },
      ]);
      setNewAreaName("");
      setAreaColumns("");
      setRowsPerColumn([]);
      setShowAddAreaForm(false);
      message.success("Area added successfully!");
    } catch {
      message.error("Failed to add area.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add Section
  const handleAddSection = async () => {
    if (!newSectionName || !selectedArea || !rateType)
      return message.warning("All fields required.");

    const vacancy = selectedArea.vacancies[selectedVacancy];
    const [, col, row] = vacancy.id.split("-");
    const column_index = parseInt(col) - 1;
    const row_index = parseInt(row) - 1;

    const payload = {
      name: newSectionName,
      area_id: selectedArea.id,
      rate_type: rateType,
      column_index,
      row_index,
      ...(rateType === "per_sqm" && { rate }),
      ...(rateType === "fixed" && { monthly_rate: monthlyRate }),
    };

    setLoadingMessage("Saving New Section...");
    setLoading(true);
    try {
      const response = await api.post("/sections", payload);
      const newSection = response.data.data;

      const updatedAreas = areas.map((area) => {
        if (area.id === selectedArea.id) {
          const updatedVacancies = [...area.vacancies];
          updatedVacancies[selectedVacancy] = {
            ...updatedVacancies[selectedVacancy],
            section: newSection,
          };
          return {
            ...area,
            vacancies: updatedVacancies,
            sections: [...area.sections, newSection],
          };
        }
        return area;
      });

      setAreas(updatedAreas);
      setNewSectionName("");
      setRateType("");
      setRate("");
      setMonthlyRate("");
      setSelectedArea(null);
      setSelectedVacancy(null);
      setShowAddSectionForm(false);
      message.success("Section added successfully!");
    } catch (err) {
      console.error(err);
      message.error("Failed to add section.");
    } finally {
      setLoading(false);
    }
  };
  const handleRefresh = async () => {
    await fetchAreas(); // Refetch the areas
    message.success("Stall refreshed!");
  };

  // ✅ Edit Section
  const handleUpdateSection = async () => {
    if (!editingSection) return;

    setLoadingMessage("Updating Section...");
    setLoading(true);
    try {
      const payload = {
        rate_type: rateType,
        ...(rateType === "per_sqm" && { rate }),
        ...(rateType === "fixed" && { monthly_rate: monthlyRate }),
      };

      const response = await api.put(`/sections/${editingSection.id}`, payload);
      const updatedSection = response.data.data;

      const updatedAreas = areas.map((area) => ({
        ...area,
        vacancies: area.vacancies.map((vac) =>
          vac.section?.id === editingSection.id
            ? { ...vac, section: updatedSection }
            : vac
        ),
        sections: area.sections.map((s) =>
          s.id === editingSection.id ? updatedSection : s
        ),
      }));

      setAreas(updatedAreas);
      setEditingSection(null);
      setRateType("");
      setRate("");
      setMonthlyRate("");
      setShowEditSectionForm(false);
      message.success("Section updated successfully!");
    } catch (err) {
      console.error(err);
      message.error("Failed to update section.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add Stalls (bulk + single from empty)
  const handleAddStall = async () => {
    if (!rowCount || columnsPerRow.some((c) => !c))
      return message.warning("Please fill out all fields");

    setLoadingMessage("Adding Stalls...");
    setLoading(true);

    try {
      const newStalls = [];
      let count = (selectedSection.stalls?.length || 0) + 1;

      for (let r = 0; r < parseInt(rowCount); r++) {
        const colCount = parseInt(columnsPerRow[r]);
        for (let c = 1; c <= colCount; c++) {
          const newStall = {
            section_id: selectedSection.id,
            stall_number: `${count}`,
            row_position: r + 1,
            column_position: c,
            size: stallSize,
            status: "vacant",
          };
          const response = await api.post("/addstall", newStall);
          newStalls.push(response.data.data);
          count++;
        }
      }

      message.success(`${newStalls.length} stalls added.`);
      setShowStallModal(false);

      const updatedAreas = areas.map((area) => ({
        ...area,
        vacancies: area.vacancies.map((vac) => {
          if (vac.section?.id === selectedSection.id) {
            return {
              ...vac,
              section: {
                ...vac.section,
                stalls: [...(vac.section.stalls || []), ...newStalls],
              },
            };
          }
          return vac;
        }),
      }));

      setAreas(updatedAreas);
    } catch (err) {
      console.error(err);
      message.error("Failed to add stalls.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Add single stall from empty cell (trigger modal)
  const handleAddSingleStall = (stallInfo) => {
    setSelectedSection({ id: stallInfo.section_id });
    setPendingStallData(stallInfo);
    setShowStallModal(true);
  };

  return (
    <div className={`section-manager ${showStallModal ? "modal-open" : ""}`}>
      <h2>Market Layout Manager</h2>
      <Button onClick={() => setEditMode(!editMode)} type="primary" style={{
        backgroundColor: "#043e54ff", // Sky Blue
        borderColor: "#87CEEB",
        color: "#fff",
        fontWeight: "bold",
      }}>
        {editMode ? "Exit Layout Editor" : "Edit Layout"}
      </Button>
      {editMode && (
        <Button type="dashed" onClick={() => setShowAddAreaForm(true)} style={{
          backgroundColor: "#043e54ff", // Sky Blue
          borderColor: "#87CEEB",
          color: "#fff",
          fontWeight: "bold",
        }}>
          + Add Area
        </Button>
      )}

      {/* ✅ Global Loading Overlay with dynamic message */}
      {loading && <LoadingOverlay message={loadingMessage} />}

      {/* Add Area Modal */}
      <Modal
        title="Add New Area"
        open={showAddAreaForm}
        onCancel={() => setShowAddAreaForm(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowAddAreaForm(false)} style={{
            backgroundColor: "#b1260aff", // Sky Blue
            borderColor: "#87CEEB",
            color: "#fff",
            fontWeight: "bold",
          }}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleAddArea} style={{
            backgroundColor: "##043e54ff", // Sky Blue
            borderColor: "#87CEEB",
            color: "#fff",
            fontWeight: "bold",
          }}>
            Save
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Area Name" required>
            <Input value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} />
          </Form.Item>
          <Form.Item label="Columns" required>
            <Input
              type="number"
              value={areaColumns}
              onChange={(e) => handleColumnsChange(e.target.value)}
            />
          </Form.Item>
          {rowsPerColumn.map((row, idx) => (
            <Form.Item key={idx} label={`Rows for Column ${idx + 1}`} required>
              <Input
                type="number"
                value={row}
                onChange={(e) => handleRowChange(idx, e.target.value)}
              />
            </Form.Item>
          ))}
        </Form>
      </Modal>

      {/* Add Section Modal */}
      <Modal
        title="Add New Section"
        open={showAddSectionForm}
        onCancel={() => setShowAddSectionForm(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowAddSectionForm(false)} style={{
            backgroundColor: "#b1260aff", // Sky Blue
            borderColor: "#87CEEB",
            color: "#fff",
            fontWeight: "bold",
          }}
          >
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleAddSection}

            style={{
              backgroundColor: "##043e54ff", // Sky Blue
              borderColor: "#87CEEB",
              color: "#fff",
              fontWeight: "bold",
            }}>
            Save
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Section Name" required>
            <Input value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} />
          </Form.Item>
          <Form.Item label="Rate Type" required>
            <Select value={rateType} onChange={(val) => setRateType(val)}>
              <Option value="per_sqm">Per SQM</Option>
              <Option value="fixed">Fixed</Option>
            </Select>
          </Form.Item>
          {rateType === "per_sqm" && (
            <Form.Item label="Rate per sqm" required>
              <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
            </Form.Item>
          )}
          {rateType === "fixed" && (
            <Form.Item label="Monthly Rate" required>
              <Input type="number" value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Edit Section Modal */}
      <Modal
        title={`Edit Section: ${editingSection?.name}`}
        open={showEditSectionForm}
        onCancel={() => setShowEditSectionForm(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowEditSectionForm(false)}

            style={{
              backgroundColor: "#b1260aff", // Sky Blue
              borderColor: "#87CEEB",
              color: "#fff",
              fontWeight: "bold",
            }}>
            Cancel
          </Button>,
          <Button key="update" type="primary" onClick={handleUpdateSection}
            style={{
              backgroundColor: "#043e54ff", // Sky Blue
              borderColor: "#87CEEB",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            Update
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Rate Type" required>
            <Select value={rateType} onChange={(val) => setRateType(val)}>
              <Option value="per_sqm">Per SQM</Option>
              <Option value="fixed">Fixed</Option>
            </Select>
          </Form.Item>
          {rateType === "per_sqm" && (
            <Form.Item label="Rate per sqm" required>
              <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
            </Form.Item>
          )}
          {rateType === "fixed" && (
            <Form.Item label="Monthly Rate" required>
              <Input type="number" value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Add Stalls Modal */}
      <Modal
        title={`Add Stalls to ${selectedSection?.name}`}
        open={showStallModal}
        onCancel={() => setShowStallModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowStallModal(false)}

            style={{
              backgroundColor: "#b1260aff", // Sky Blue
              borderColor: "#87CEEB",
              color: "#fff",
              fontWeight: "bold",
            }}>
            Cancel
          </Button>,
          <Button key="add" type="primary" onClick={handleAddStall}

            style={{
              backgroundColor: "#043e54ff", // Sky Blue
              borderColor: "#87CEEB",
              color: "#fff",
              fontWeight: "bold",
            }}>
            Add
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Number of Rows" required>
            <Input type="number" value={rowCount} onChange={(e) => handleRowCountChange(e.target.value)} />
          </Form.Item>
          {columnsPerRow.map((col, idx) => (
            <Form.Item key={idx} label={`Columns for Row ${idx + 1}`} required>
              <Input type="number" value={col} onChange={(e) => handleColumnsPerRowChange(idx, e.target.value)} />
            </Form.Item>
          ))}
          <Form.Item label="Size (sqm)">
            <Input type="text" value={stallSize} onChange={(e) => setStallSize(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Areas Grid */}
      <div className="areas">
        {areas.map((area) => (
          <div key={area.id} className="area">
            <div className="legend">
              <div className="legend-item"><span className="dot vacant-dot" /> Vacant</div>
              <div className="legend-item"><span className="dot occupied-dot" /> Occupied(not paid)</div>
              <div className="legend-item"><span className="dot missed-dot" /> Missed</div>
              <div className="legend-item"><span className="dot paid-dot" /> Paid Today</div>
              <div className="legend-item"><span className="dot empty-dot" /> Empty</div>
            </div>

            <div className="area-header"><h3>{area.name}</h3></div>

            <div className="area-grid">
              {area.rows_per_column.map((rowCount, colIdx) => (
                <div key={colIdx} className="area-column">
                  {Array.from({ length: rowCount }, (_, rowIdx) => {
                    const vacId = `vacant-${colIdx + 1}-${rowIdx + 1}`;
                    const vacIndex = area.vacancies.findIndex((v) => v.id === vacId);
                    const vac = area.vacancies[vacIndex];

                    return (
                      <div key={vac.id} className={`vacancy ${vac.section ? "has-section" : "empty"}`}>
                        {vac.section ? (
                          <div className="section-box">
                            <h4>{vac.section.name} Stalls</h4>
                            <StallGrid section={vac.section} editMode={editMode} onAddStall={handleAddSingleStall} onRefresh={handleRefresh} />
                            {editMode && (
                              <>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSection(vac.section);
                                    setRateType(vac.section.rate_type);
                                    setRate(vac.section.rate || "");
                                    setMonthlyRate(vac.section.monthly_rate || "");
                                    setShowEditSectionForm(true);
                                  }}
                                  size="small"
                                  style={{
                                    backgroundColor: "#043e54ff", // Sky Blue
                                    borderColor: "#87CEEB",
                                    color: "#fff",
                                    fontWeight: "bold",
                                    marginRight: 4
                                  }}
                                >
                                  ✏️ Edit Section
                                </Button>
                              <Button
  size="small"
  onClick={(e) => {
    e.stopPropagation();           // prevent parent click
    setSelectedSection(vac.section); // set the selected section
    setShowStallModal(true);        // open the add stall modal
  }}
  style={{
    backgroundColor: "#043e54ff",
    borderColor: "#87CEEB",
    color: "#fff",
    fontWeight: "bold",
    marginRight: 4,
  }}
>
  + Add Stall
</Button>


                              </>
                            )}
                          </div>
                        ) : (
                          editMode && (
                            <Button
                              type="dashed"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedArea(area);
                                setSelectedVacancy(vacIndex);
                                setShowAddSectionForm(true);
                              }}
                              style={{
                                backgroundColor: "#043e54ff", // Sky Blue
                                borderColor: "#87CEEB",
                                color: "#fff",
                                fontWeight: "bold",
                                marginRight: 4
                              }}
                            >
                              ➕ Add Section
                            </Button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionManager;
