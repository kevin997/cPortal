"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getImportBatches,
  importLeadsFile,
  ImportBatch,
  ImportResult,
} from "@/lib/marketing-api";

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const data = await getImportBatches();
      setBatches(data);
    } catch (error) {
      console.error("Error fetching import batches:", error);
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleFileSelect = (selected: File | null) => {
    setResult(null);
    setFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileSelect(dropped);
  };

  const runImport = async (dryRun: boolean) => {
    if (!file) {
      toast({
        title: "Aucun fichier sélectionné",
        description: "Choisissez un fichier .xlsx ou .csv à importer",
        variant: "destructive",
      });
      return;
    }
    dryRun ? setAnalyzing(true) : setImporting(true);
    try {
      const data = await importLeadsFile(file, dryRun);
      setResult(data);
      toast({
        title: dryRun ? "Analyse terminée" : "Import terminé",
        description: `${data.totals.leads_created} créés, ${data.totals.leads_updated} mis à jour`,
        variant: "success",
      });
      if (!dryRun) {
        fetchBatches();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Impossible de traiter le fichier",
        variant: "destructive",
      });
    } finally {
      dryRun ? setAnalyzing(false) : setImporting(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Import de leads</h2>
        <p className="text-muted-foreground">
          Importez des prospects depuis un fichier Excel ou CSV
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
          >
            <UploadCloud className="w-10 h-10 text-muted-foreground" />
            {file ? (
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span className="font-medium">{file.name}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Glissez-déposez un fichier .xlsx ou .csv, ou cliquez pour parcourir
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => runImport(true)}
              disabled={!file || analyzing || importing}
              className="w-full sm:w-auto"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Analyser (test)
            </Button>
            <Button
              onClick={() => runImport(false)}
              disabled={!file || analyzing || importing}
              className="w-full sm:w-auto"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              Importer
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Résumé
                {result.dry_run && <Badge variant="secondary">Test (dry run)</Badge>}
              </CardTitle>
              <CardDescription>Lot {result.batch_id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{result.totals.sheets_imported}</p>
                  <p className="text-xs text-muted-foreground">Feuilles importées</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {result.totals.sheets_skipped}
                  </p>
                  <p className="text-xs text-muted-foreground">Feuilles ignorées</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {result.totals.leads_created}
                  </p>
                  <p className="text-xs text-muted-foreground">Leads créés</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {result.totals.leads_updated}
                  </p>
                  <p className="text-xs text-muted-foreground">Leads mis à jour</p>
                </div>
              </div>
              {result.totals.rows_skipped > 0 && (
                <p className="mt-3 text-sm text-muted-foreground text-center">
                  {result.totals.rows_skipped} ligne(s) ignorée(s)
                </p>
              )}
            </CardContent>
          </Card>

          {result.sheets.map((sheet) => (
            <Card
              key={sheet.sheet}
              className={sheet.status === "skipped" ? "opacity-70" : ""}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {sheet.status === "imported" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  {sheet.sheet}
                  {sheet.ai_assisted && (
                    <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">
                      <Sparkles className="w-3 h-3" />
                      IA
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sheet.status === "skipped" ? (
                  <p className="text-sm text-muted-foreground">
                    Ignorée{sheet.reason ? ` — ${sheet.reason}` : ""}
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span>
                        <span className="text-muted-foreground">Lignes : </span>
                        {sheet.rows_total ?? 0}
                      </span>
                      <span className="text-green-600">
                        Créés : {sheet.created ?? 0}
                      </span>
                      <span className="text-blue-600">
                        Mis à jour : {sheet.updated ?? 0}
                      </span>
                      {!!sheet.skipped_rows && (
                        <span className="text-muted-foreground">
                          Ignorées : {sheet.skipped_rows}
                        </span>
                      )}
                    </div>
                    {sheet.mapping && Object.keys(sheet.mapping).length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b text-left text-muted-foreground">
                              <th className="py-1 pr-4 font-medium">Colonne source</th>
                              <th className="py-1 font-medium">Champ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(sheet.mapping).map(([header, field]) => (
                              <tr key={header} className="border-b last:border-0">
                                <td className="py-1 pr-4">{header}</td>
                                <td className="py-1 font-medium">{field}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Historique des imports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBatches ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : batches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun import précédent
            </p>
          ) : (
            <div className="space-y-2">
              {batches.map((batch) => (
                <div
                  key={batch.batch_id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">Lot {batch.batch_id}</p>
                    <p className="text-muted-foreground">
                      {format(new Date(batch.created_at), "d MMM yyyy 'à' HH:mm", {
                        locale: fr,
                      })}
                      {batch.dry_run && " · test"}
                    </p>
                  </div>
                  <div className="flex gap-4 text-muted-foreground">
                    <span className="text-green-600">
                      +{batch.totals.leads_created}
                    </span>
                    <span className="text-blue-600">
                      ~{batch.totals.leads_updated}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
