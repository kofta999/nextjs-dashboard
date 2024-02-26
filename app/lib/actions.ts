'use server';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as yup from 'yup';

const FormSchema = yup.object().shape({
  id: yup.string().required(),
  customerId: yup.string().required(),
  amount: yup.number().required(),
  status: yup.string().oneOf(['pending', 'paid']).required(),
  date: yup.string().required(),
});

const CreateInvoice = FormSchema.omit(['id', 'date']);
const UpdateInvoice = FormSchema.omit(['id', 'date']);

export async function createInvoice(formData: FormData) {
  try {
    const rawFormData = Object.fromEntries(formData.entries());
    const { customerId, amount, status } =
      await CreateInvoice.validate(rawFormData);

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  try {
    const { customerId, amount, status } = await UpdateInvoice.validate(
      Object.fromEntries(formData.entries()),
    );

    const amountInCents = amount * 100;

    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  throw new Error('Failed to delete Invoice.');
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return {
      message: 'Deleted Invoice.',
    };
  } catch (error) {
    return {
      message: 'Database Error: Failed to Delete Invoice.',
    };
  }
}
