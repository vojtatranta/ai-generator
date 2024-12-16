"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/web/components/ui/button";
import { Modal } from "@/web/components/ui/modal";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { User } from "@/lib/supabase-server";
import { trpcApi } from "@/components/providers/TRPCProvider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { stripe } from "@/lib/stripe";
import { ScrollArea } from "@radix-ui/react-scroll-area";

export type StripeKeyObject = {
  clientSessionSecret: string;
  publishableApiKey: string;
};

type ImportModalProps = {
  stripeKeyObject: StripeKeyObject;
  isOpen: boolean;
  onClose: () => void;
};

type CheckouReturn = {
  mount: (selector: string) => Promise<void>;
};

type WindowStripeApi = {
  initEmbeddedCheckout: (props: {
    fetchClientSecret: () => Promise<string>;
  }) => Promise<CheckouReturn>;
};

type WindowStripeFactory = (publishableApiKey: string) => WindowStripeApi;

const getStripeFromWindow = (
  publishableApiKey: string,
): WindowStripeApi | null => {
  if (typeof window !== "undefined" && "assignedStripe" in window) {
    return window["assignedStripe"] as WindowStripeApi;
  }

  if (typeof window !== "undefined" && "Stripe" in window) {
    const stripeFactory = window.Stripe as WindowStripeFactory | null;
    if (stripeFactory) {
      const assignedStripe = stripeFactory(publishableApiKey);
      window["assignedStripe"] = assignedStripe;
      return assignedStripe;
    }
  }
  return null;
};

export const PaymentModal: React.FC<{
  stripeObject: StripeKeyObject;
  isOpen: boolean;
  onClose: () => void;
}> = ({ stripeObject, isOpen, onClose }) => {
  const stripeElementId = "stripe-element-in-modal";
  const stripElementId = "script-element-in-modal";
  const scriptLoadRef = useRef<boolean>(false);

  useEffect(() => {
    if (document.getElementById(stripElementId) || scriptLoadRef.current) {
      return;
    }

    scriptLoadRef.current = true;

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.id = stripElementId;

    const handleScriptLoaded = () => {
      const stripe = getStripeFromWindow(stripeObject.publishableApiKey);
      if (!stripe) {
        throw new Error("Stripe not found");
      }

      stripe
        .initEmbeddedCheckout({
          fetchClientSecret: () =>
            Promise.resolve(stripeObject.clientSessionSecret),
        })
        .then((checkout) => {
          checkout.mount(`#${stripeElementId}`);
        });
    };

    script.onload = handleScriptLoaded;
    document.body.appendChild(script);
    return () => {
      delete window["assignedStripe"];
      delete window["Stripe"];
      document.body.removeChild(script);
    };
  }, []);

  return (
    <Modal
      dialogContentClassName="max-w-[800px]"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 h-[600px] overflow-y-scroll">
        <div id={stripeElementId} />
      </div>
    </Modal>
  );
};

export const PaymentModalContainer: React.FC<{
  stripeObject: StripeKeyObject;
  isOpen: boolean;
  onClose: () => void;
}> = ({ stripeObject, isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <PaymentModal
        stripeObject={stripeObject}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  );
};
