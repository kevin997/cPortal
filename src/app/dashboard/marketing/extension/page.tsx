import {
  CheckCircle2,
  Download,
  ExternalLink,
  MessageCircleMore,
  Settings2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    icon: Download,
    title: "Télécharger et extraire",
    detail: "Téléchargez le fichier ZIP, puis extrayez-le dans un dossier que vous conserverez.",
  },
  {
    icon: ExternalLink,
    title: "Ouvrir les extensions Chrome",
    detail: "Saisissez chrome://extensions dans la barre d’adresse et activez le Mode développeur.",
  },
  {
    icon: Upload,
    title: "Charger le dossier",
    detail: "Cliquez sur Charger l’extension non empaquetée et choisissez le dossier chrome-extension extrait.",
  },
  {
    icon: Settings2,
    title: "Configurer et tester",
    detail: "Ouvrez Options, renseignez le token fourni par l’administrateur, puis testez la connexion.",
  },
];

const fields = [
  "Nom, téléphone et e-mail",
  "Entreprise, ville et pays",
  "Produit ou service recherché",
  "Étape et valeur estimée",
  "Date de prochaine relance",
  "Contexte, prochaine action et accord de contact",
];

export default function ExtensionGuidePage() {
  return (
    <div className="space-y-6 py-6">
      <section className="overflow-hidden rounded-3xl bg-[#12372d] px-5 py-7 text-white sm:px-8 sm:py-9">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            <MessageCircleMore className="h-4 w-4" />
            WhatsApp Web + cPortal
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Installer le CRM WhatsApp CSL</h1>
          <p className="mt-3 text-sm leading-6 text-emerald-50/80 sm:text-base">
            Qualifiez un contact, planifiez sa relance et enregistrez son accord directement au-dessus de la conversation WhatsApp.
          </p>
          <Button asChild className="mt-6 w-full bg-white text-[#12372d] hover:bg-emerald-50 sm:w-auto">
            <a href="/downloads/csl-whatsapp-crm-1.1.0.zip" download>
              <Download className="h-4 w-4" />
              Télécharger l’extension 1.1.0
            </a>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Installation en 4 étapes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <step.icon className="h-4 w-4" />
                  </span>
                  <p className="font-semibold">{index + 1}. {step.title}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fiche CRM capturée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field) => (
              <div key={field} className="flex gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{field}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="py-4 text-sm leading-6 text-amber-950">
          Le token donne accès au CRM. Ne l’envoyez pas dans WhatsApp et ne partagez pas le dossier configuré. En cas de changement de poste, demandez un nouveau token à l’administrateur.
        </CardContent>
      </Card>
    </div>
  );
}
