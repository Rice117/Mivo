"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Button, Card, Field, Page } from "../ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Page title="Connexion" intro="">
      <Card>
        {/* Honnêteté : ce formulaire ne connecte encore personne. Il affichait
            auparavant un bouton qui semblait fonctionner alors qu'il ne faisait
            qu'écrire dans la console — mieux vaut le dire que le laisser croire. */}
        <Alert>
          La connexion n'est pas encore branchée : l'application n'a pas de comptes pour le
          moment, et toutes les pages sont accessibles directement. Cet écran attend la mise en
          place de Supabase.
        </Alert>

        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Field label="Adresse email" type="email" value={email} onChange={setEmail} />
          <Field label="Mot de passe" type="password" value={password} onChange={setPassword} />
          <Button type="submit" disabled>
            Se connecter (bientôt)
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
