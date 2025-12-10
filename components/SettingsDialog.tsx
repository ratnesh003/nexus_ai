import React, { useState } from "react";
import { db } from "../services/mockDb";
import { Button, Input, Card } from "./ui";
import { ChevronRight } from "lucide-react";

interface SettingsDialogProps {
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const config = db.getConfig();
  const [useReal, setUseReal] = useState(config.useRealBackend);
  const [formData, setFormData] = useState(config);

  const handleSave = () => {
    db.updateConfig({ ...formData, useRealBackend: useReal });
    window.location.reload(); // Reload to refresh services
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-xl font-bold">App Configuration</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-lg border">
            <input
              type="checkbox"
              id="useReal"
              checked={useReal}
              onChange={(e) => setUseReal(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
            />
            <label htmlFor="useReal" className="font-medium">
              Enable Real Backend Integration
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Without this enabled, the app uses LocalStorage. Enable to connect
            to MongoDB Data API and Cloudinary.
          </p>

          {useReal && (
            <>
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-accent">MongoDB Data API</h3>
                <p className="text-xs text-slate-500">
                  Enable the Data API in MongoDB Atlas <ChevronRight className="inline mb-0.5" size={16} /> Services{" "}
                  <ChevronRight className="inline mb-0.5" size={16} /> Data API.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-medium">
                      Data API URL Endpoint
                    </label>
                    <Input
                      value={formData.mongoDbUrl || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, mongoDbUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium">API Key</label>
                    <Input
                      type="password"
                      value={formData.mongoDbApiKey || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mongoDbApiKey: e.target.value,
                        })
                      }
                      placeholder="Secret Key"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Cluster Name</label>
                    <Input
                      value={formData.mongoDbCluster || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mongoDbCluster: e.target.value,
                        })
                      }
                      placeholder="Cluster0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Database Name</label>
                    <Input
                      value={formData.mongoDbDatabase || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mongoDbDatabase: e.target.value,
                        })
                      }
                      placeholder="datanexus"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-accent">Cloudinary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium">Cloud Name</label>
                    <Input
                      value={formData.cloudinaryCloudName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cloudinaryCloudName: e.target.value,
                        })
                      }
                      placeholder="cloud_name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">
                      Upload Preset (Unsigned)
                    </label>
                    <Input
                      value={formData.cloudinaryUploadPreset || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cloudinaryUploadPreset: e.target.value,
                        })
                      }
                      placeholder="ml_default"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save & Reload</Button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsDialog;
