"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/web/components/ui/accordion";
import { Button } from "@/web/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/web/components/ui/form";
import { Heading } from "@/web/components/ui/heading";
import { Input } from "@/web/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/web/components/ui/select";
import { Separator } from "@/web/components/ui/separator";
import {
  getProfileFormSchema,
  type ProfileFormValues,
} from "@/web/lib/form-schema";
import { cn } from "@/web/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangleIcon, Trash, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";

interface ProfileFormType {
  initialData: any | null;
  categories: any;
}
const ProfileCreateForm: React.FC<ProfileFormType> = ({
  initialData,
  categories,
}) => {
  const params = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const title = initialData ? "Edit product" : "Create Your Profile";
  const description = initialData
    ? "Edit a product."
    : "To create your resume, we first need some basic information about you.";
  const toastMessage = initialData ? "Product updated." : "Product created.";
  const action = initialData ? "Save changes" : "Create";
  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({});
  const t = useTranslations("profile");
  const delta = currentStep - previousStep;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(getProfileFormSchema(t)),
    defaultValues: {
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      contactno: initialData?.contactno ?? "",
    },
    mode: "onChange",
  });

  const {
    control,
    formState: { errors },
  } = form;

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        // await axios.post(`/api/products/edit-product/${initialData._id}`, data);
      } else {
        // const res = await axios.post(`/api/products/create-product`, data);
        // console.log("product", res);
      }
      router.refresh();
      router.push(`/products`);
    } catch (error: any) {
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      //   await axios.delete(`/api/${params.storeId}/products/${params.productId}`);
      router.refresh();
      router.push(`/${params.storeId}/products`);
    } catch (error: any) {
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const processForm: SubmitHandler<ProfileFormValues> = (data) => {
    setData(data);
    // api call and reset
    // form.reset();
  };

  type FieldName = keyof ProfileFormValues;

  const steps = [
    {
      id: "Step 1",
      name: "Personal Information",
      fields: ["name", "contactno"],
    },
  ];

  const next = async () => {
    const fields = steps[currentStep].fields;

    const output = await form.trigger(fields as FieldName[], {
      shouldFocus: true,
    });

    if (!output) return;

    if (currentStep < steps.length - 1) {
      if (currentStep === steps.length - 2) {
        await form.handleSubmit(processForm)();
      }
      setPreviousStep(currentStep);
      setCurrentStep((step) => step + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setPreviousStep(currentStep);
      setCurrentStep((step) => step - 1);
    }
  };

  const countries = [{ id: "wow", name: "india" }];
  const cities = [{ id: "2", name: "kerala" }];

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <div>
        <ul className="flex gap-4">
          {steps.map((step, index) => (
            <li key={step.name} className="md:flex-1">
              {currentStep > index ? (
                <div className="group flex w-full flex-col border-l-4 border-sky-600 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-sm font-medium text-sky-600 transition-colors ">
                    {step.id}
                  </span>
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
              ) : currentStep === index ? (
                <div
                  className="flex w-full flex-col border-l-4 border-sky-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                  aria-current="step"
                >
                  <span className="text-sm font-medium text-sky-600">
                    {step.id}
                  </span>
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
              ) : (
                <div className="group flex h-full w-full flex-col border-l-4 border-gray-200 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-sm font-medium text-gray-500 transition-colors">
                    {step.id}
                  </span>
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(processForm)}
          className="w-full space-y-8"
        >
          <div
            className={cn(
              currentStep === 1
                ? "w-full md:inline-block"
                : "gap-8 md:grid md:grid-cols-3",
            )}
          >
            {currentStep === 0 && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder="John"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder="johndoe@gmail.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter you contact number"
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          {/* <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button> */}
        </form>
      </Form>
      {/* Navigation */}
      <div className="mt-8 pt-5">
        <div className="flex justify-between">
          <button
            type="button"
            onClick={prev}
            disabled={currentStep === 0}
            className="rounded bg-white px-2 py-1 text-sm font-semibold text-sky-900 shadow-sm ring-1 ring-inset ring-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            disabled={currentStep === steps.length - 1}
            className="rounded bg-white px-2 py-1 text-sm font-semibold text-sky-900 shadow-sm ring-1 ring-inset ring-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileCreateForm;
