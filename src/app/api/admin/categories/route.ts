import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { validateContentLength, verifyRequestOrigin } from '@/lib/security';
import { invalidateCategoryCache } from '@/lib/siteSettings';

export async function POST(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, icon, color, order } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Kategori adı ve açıklaması zorunludur.' },
        { status: 400 }
      );
    }

    const nameLen = validateContentLength(String(name), 60, 'Kategori adı');
    if (!nameLen.valid) {
      return NextResponse.json({ error: nameLen.error }, { status: 400 });
    }

    const descLen = validateContentLength(String(description), 250, 'Kategori açıklaması');
    if (!descLen.valid) {
      return NextResponse.json({ error: descLen.error }, { status: 400 });
    }

    const validColor =
      color && /^#[0-9a-fA-F]{6}$/.test(String(color)) ? String(color) : '#6366f1';

    const baseSlug = slugify(name) || `kategori-${Date.now()}`;
    const existing = await prisma.category.findUnique({ where: { slug: baseSlug } });
    const slug = existing ? `${baseSlug}-${Math.random().toString(36).substring(2, 5)}` : baseSlug;

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description.trim(),
        icon: icon || 'MessageSquare',
        color: validColor,
        order: typeof order === 'number' ? order : 10,
      },
    });

    invalidateCategoryCache();
    return NextResponse.json({ category });
  } catch (error) {
    console.error('Admin create category error:', error);
    return NextResponse.json({ error: 'Kategori oluşturulamadı.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, icon, color, order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Kategori ID gerekli.' }, { status: 400 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description ? { description: description.trim() } : {}),
        ...(icon ? { icon } : {}),
        ...(color ? { color } : {}),
        ...(typeof order === 'number' ? { order } : {}),
      },
    });

    invalidateCategoryCache();
    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error('Admin update category error:', error);
    return NextResponse.json({ error: 'Kategori güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!verifyRequestOrigin(request)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Kategori ID gerekli.' }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });
    invalidateCategoryCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete category error:', error);
    return NextResponse.json({ error: 'Kategori silinemedi.' }, { status: 500 });
  }
}

