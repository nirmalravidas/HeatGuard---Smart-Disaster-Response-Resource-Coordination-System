"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";

export default function AllocatorDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [camps, setCamps] = useState<any[]>([]);
  const [campInputs, setCampInputs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [aiPlan, setAiPlan] = useState<any>(null);
  const [apiError, setApiError] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampForAssignment, setSelectedCampForAssignment] = useState("");

  const loadReports = async () => {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setReports(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const loadCamps = async () => {
    const snap = await getDocs(collection(db, "camps"));
    const loaded = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
    setCamps(loaded);
    setCampInputs(
      loaded.reduce((acc, camp) => {
        acc[camp.id] = {
          water: camp.supplies?.water ?? 0,
          medicalKits: camp.supplies?.medicalKits ?? 0,
          ORS: camp.supplies?.ORS ?? 0,
          coolingKits: camp.supplies?.coolingKits ?? 0,
        };
        return acc;
      }, {} as Record<string, any>)
    );
  };

  useEffect(() => {
    const load = async () => {
      await loadReports();
      await loadCamps();
      setLoading(false);
    };

    load();
  }, []);

  const sanitizeReports = (rawReports: any[]) =>
    rawReports.map((report) => ({
      id: report.id,
      text: report.text,
      urgencyScore: report.urgencyScore,
      resources: report.resources,
      status: report.status,
      location: report.location,
    }));

  const sanitizeCamps = (rawCamps: any[]) =>
    rawCamps.map((camp) => ({
      id: camp.id,
      name: camp.name,
      capacity: camp.capacity,
      currentLoad: camp.currentLoad,
      supplies: camp.supplies,
      location: camp.location,
    }));

  const runAllocatorAI = async () => {
    try {
      setApiError("");
      setLoading(true);
      const res = await fetch("/api/ai/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reports: sanitizeReports(reports),
          camps: sanitizeCamps(camps),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "AI allocation failed");
      }

      setAiPlan(data);
      setCommitMessage("");
    } catch (err) {
      console.error(err);
      setApiError("AI allocation failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const updateCampSupply = async (campId: string) => {
    const supplies = campInputs[campId];
    if (!supplies) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "camps", campId), {
        supplies,
      });
      await loadCamps();
      setCommitMessage("Camp inventory updated.");
    } catch (err) {
      console.error(err);
      setApiError("Failed to save camp inventory.");
    } finally {
      setLoading(false);
    }
  };

  const commitAllocationPlan = async () => {
    if (!aiPlan?.allocations?.length) return;

    setLoading(true);
    try {
      const campMap = new Map<string, any>();
      camps.forEach((camp) => {
        campMap.set(camp.id, {
          ...camp,
          supplies: {
            water: camp.supplies?.water ?? 0,
            medicalKits: camp.supplies?.medicalKits ?? 0,
            ORS: camp.supplies?.ORS ?? 0,
            coolingKits: camp.supplies?.coolingKits ?? 0,
          },
        });
      });

      for (const allocation of aiPlan.allocations) {
        if (!allocation?.reportId) continue;

        await updateDoc(doc(db, "reports", allocation.reportId), {
          allocationPlan: allocation,
          status: "assigned",
        });

        if (allocation.campId && allocation.resources) {
          const camp = campMap.get(allocation.campId);
          if (camp) {
            camp.supplies = {
              water: Math.max(0, (camp.supplies.water ?? 0) - (allocation.resources.water ?? 0)),
              medicalKits: Math.max(0, (camp.supplies.medicalKits ?? 0) - (allocation.resources.medicalKits ?? 0)),
              ORS: Math.max(0, (camp.supplies.ORS ?? 0) - (allocation.resources.ORS ?? 0)),
              coolingKits: Math.max(0, (camp.supplies.coolingKits ?? 0) - (allocation.resources.coolingKits ?? 0)),
            };
          }
        }
      }

      for (const [campId, camp] of campMap.entries()) {
        await updateDoc(doc(db, "camps", campId), {
          supplies: camp.supplies,
        });
      }

      await loadReports();
      await loadCamps();
      setCommitMessage("Allocation committed and camp inventory updated.");
    } catch (err) {
      console.error(err);
      setApiError("Failed to commit allocation plan.");
    } finally {
      setLoading(false);
    }
  };

  const assignReportToCamp = async (reportId: string, campId: string) => {
    if (!reportId || !campId) return;

    setLoading(true);
    try {
      const camp = camps.find(c => c.id === campId);
      await updateDoc(doc(db, "reports", reportId), {
        allocationPlan: {
          campId,
          campName: camp?.name,
          priority: "manual",
          supplyStatus: "assigned",
          resources: selectedReport?.resources || {},
        },
        status: "assigned",
      });
      await loadReports();
      setCommitMessage("Report assigned to camp manually.");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setApiError("Failed to assign report to camp.");
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status,
      });
      await loadReports();
      setCommitMessage(`Report status updated to ${status}.`);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setApiError("Failed to update report status.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] text-white flex items-center justify-center">
        Loading allocator dashboard...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0B1220] text-white">
      <div className="flex-1 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">⚖️ Allocator Command Center</h1>
            <p className="text-gray-400 text-sm">AI-powered disaster resource distribution system</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={runAllocatorAI} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
              Run AI Allocation
            </button>
            <button onClick={commitAllocationPlan} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              Commit Allocation Plan
            </button>
          </div>
        </div>

        {apiError ? (
          <div className="rounded-xl border border-red-500 bg-red-950 p-4 text-red-300">
            {apiError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111A2E] border border-[#1F2A44] p-4 rounded-xl">
            <p className="text-gray-400 text-sm">Total Reports</p>
            <h2 className="text-2xl font-bold">{reports.length}</h2>
          </div>
          <div className="bg-[#111A2E] border border-[#1F2A44] p-4 rounded-xl">
            <p className="text-gray-400 text-sm">High Priority</p>
            <h2 className="text-2xl font-bold text-red-400">{reports.filter((r) => r.urgencyScore > 70).length}</h2>
          </div>
          <div className="bg-[#111A2E] border border-[#1F2A44] p-4 rounded-xl">
            <p className="text-gray-400 text-sm">Pending Allocation</p>
            <h2 className="text-2xl font-bold text-yellow-400">{reports.filter((r) => r.status === "pending").length}</h2>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-[#111A2E] border border-[#1F2A44] p-4 rounded-xl">
            <h2 className="font-semibold mb-3">Camp Supply Inventory</h2>
            <div className="space-y-4">
              {camps.map((camp) => (
                <div key={camp.id} className="bg-[#0B1220] border border-[#172136] p-4 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{camp.name}</h3>
                      <p className="text-sm text-gray-400">Load: {camp.currentLoad}/{camp.capacity}</p>
                    </div>
                    <button onClick={() => updateCampSupply(camp.id)} className="bg-blue-600 px-3 py-2 rounded text-sm">
                      Save
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    <label className="block">
                      <span className="text-gray-400">Water</span>
                      <input
                        type="number"
                        value={campInputs[camp.id]?.water ?? 0}
                        onChange={(e) =>
                          setCampInputs((prev) => ({
                            ...prev,
                            [camp.id]: { ...prev[camp.id], water: Number(e.target.value) },
                          }))
                        }
                        className="mt-1 w-full rounded border bg-[#111A2E] p-2 text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="text-gray-400">Medical Kits</span>
                      <input
                        type="number"
                        value={campInputs[camp.id]?.medicalKits ?? 0}
                        onChange={(e) =>
                          setCampInputs((prev) => ({
                            ...prev,
                            [camp.id]: { ...prev[camp.id], medicalKits: Number(e.target.value) },
                          }))
                        }
                        className="mt-1 w-full rounded border bg-[#111A2E] p-2 text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="text-gray-400">ORS</span>
                      <input
                        type="number"
                        value={campInputs[camp.id]?.ORS ?? 0}
                        onChange={(e) =>
                          setCampInputs((prev) => ({
                            ...prev,
                            [camp.id]: { ...prev[camp.id], ORS: Number(e.target.value) },
                          }))
                        }
                        className="mt-1 w-full rounded border bg-[#111A2E] p-2 text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="text-gray-400">Cooling Kits</span>
                      <input
                        type="number"
                        value={campInputs[camp.id]?.coolingKits ?? 0}
                        onChange={(e) =>
                          setCampInputs((prev) => ({
                            ...prev,
                            [camp.id]: { ...prev[camp.id], coolingKits: Number(e.target.value) },
                          }))
                        }
                        className="mt-1 w-full rounded border bg-[#111A2E] p-2 text-white"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111A2E] border border-[#1F2A44] p-4 rounded-xl">
            <h2 className="font-semibold mb-3">📄 Incoming Crisis Reports</h2>
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="bg-[#0B1220] border border-[#1F2A44] p-3 rounded">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <p className="font-semibold">{String(report.text)?.slice(0, 60)}...</p>
                      <p className="text-sm text-gray-400">Status: {report.status || "pending"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedReport(report); setIsModalOpen(true); }}
                        className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
                      >
                        View Details
                      </button>
                      <span className="text-yellow-400 font-bold">{report.urgencyScore || "N/A"}</span>
                    </div>
                  </div>
                  {report.allocationPlan && (
                    <div className="mt-3 text-sm text-gray-300">
                      <p>Assigned camp: {report.allocationPlan.campName || report.allocationPlan.campId}</p>
                      <p>Supply status: {report.allocationPlan.supplyStatus}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {aiPlan && (
          <div className="bg-[#111A2E] border border-[#1F2A44] p-4 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="font-semibold">AI Allocation Plan</h2>
                <p className="text-green-400">Bias Score: {aiPlan.bias_score}</p>
              </div>
              {commitMessage && <span className="text-green-300">{commitMessage}</span>}
            </div>
            <p className="mt-2 text-gray-300">{aiPlan.audit_notes}</p>
            <div className="mt-4 space-y-3">
              {aiPlan.allocations?.map((allocation: any) => (
                <div key={allocation.reportId} className="bg-[#0B1220] p-3 rounded border border-[#172136]">
                  <p className="font-semibold">Report ID: {allocation.reportId}</p>
                  <p>Camp: {allocation.campName || allocation.campId}</p>
                  <p>Priority: {allocation.priority}</p>
                  <p>Status: {allocation.supplyStatus}</p>
                  <div className="mt-2 text-sm text-gray-300">
                    <p>Water: {allocation.resources?.water}</p>
                    <p>Medical Kits: {allocation.resources?.medicalKits}</p>
                    <p>ORS: {allocation.resources?.ORS}</p>
                    <p>Cooling Kits: {allocation.resources?.coolingKits}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#111A2E] border border-[#1F2A44] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Report Details</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Full Report Text</label>
                <p className="mt-1 p-3 bg-[#0B1220] border border-[#172136] rounded text-white">
                  {selectedReport.text}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Urgency Score</label>
                  <p className="mt-1 p-2 bg-[#0B1220] border border-[#172136] rounded text-yellow-400 font-bold">
                    {selectedReport.urgencyScore || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Status</label>
                  <p className="mt-1 p-2 bg-[#0B1220] border border-[#172136] rounded text-white">
                    {selectedReport.status || "pending"}
                  </p>
                </div>
              </div>

              {selectedReport.resources && (
                <div>
                  <label className="block text-sm font-medium text-gray-400">Resources Needed</label>
                  <div className="mt-1 p-3 bg-[#0B1220] border border-[#172136] rounded">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>Water: {selectedReport.resources.water || 0}</p>
                      <p>Medical Kits: {selectedReport.resources.medicalKits || 0}</p>
                      <p>ORS: {selectedReport.resources.ORS || 0}</p>
                      <p>Cooling Kits: {selectedReport.resources.coolingKits || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedReport.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-400">Location</label>
                  <p className="mt-1 p-2 bg-[#0B1220] border border-[#172136] rounded text-white">
                    {selectedReport.location.lat}, {selectedReport.location.lng}
                  </p>
                </div>
              )}

              {selectedReport.allocationPlan && (
                <div>
                  <label className="block text-sm font-medium text-gray-400">Current Allocation</label>
                  <div className="mt-1 p-3 bg-[#0B1220] border border-[#172136] rounded text-sm">
                    <p>Camp: {selectedReport.allocationPlan.campName || selectedReport.allocationPlan.campId}</p>
                    <p>Priority: {selectedReport.allocationPlan.priority}</p>
                    <p>Supply Status: {selectedReport.allocationPlan.supplyStatus}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#1F2A44]">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Assign to Camp</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCampForAssignment}
                      onChange={(e) => setSelectedCampForAssignment(e.target.value)}
                      className="flex-1 bg-[#0B1220] border border-[#172136] rounded px-3 py-2 text-white"
                    >
                      <option value="">Select Camp</option>
                      {camps.map((camp) => (
                        <option key={camp.id} value={camp.id}>
                          {camp.name} (Load: {camp.currentLoad}/{camp.capacity})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => assignReportToCamp(selectedReport.id, selectedCampForAssignment)}
                      disabled={!selectedCampForAssignment}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
                    >
                      Assign
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => updateReportStatus(selectedReport.id, "in_progress")}
                    className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded"
                  >
                    Mark In Progress
                  </button>
                  <button
                    onClick={() => updateReportStatus(selectedReport.id, "resolved")}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
