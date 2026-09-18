"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Button, Card, Field, Page } from "../ui";

export default function SignupPage() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Page title="Créer un compte" intro="">
      <Card>
        <Alert>
          La création de compte n'est pas encore branchée. L'application fonctionne aujourd'hui
          sans compte : tes chiffres restent sur ton appareil.
        </Alert>

        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Field label="Nom" value={nom} onChange={setNom} />
          <Field label="Adresse email" type="email" value={email} onChange={setEmail} />
          <Field label="Mot de passe" type="password" value={password} onChange={setPassword} />
          <Button type="submit" disabled>
            Créer mon compte (bientôt)
          </Button>
        </form>

        <p className="mt-5 text-[15px] text-slate-400">
          <Link href="/" className="text-amber-400 underline">
            Continuer sans compte
          </Link>
        </p>
      </Card>
    </Page>
  );
}
