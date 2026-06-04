/**
 * base64 data URL 또는 ObjectURL을 File 객체로 변환
 * - data URL (camera): atob으로 디코딩 → Blob → File
 * - ObjectURL (gallery): fetch → Blob → File
 */
export async function photoUrlToFile(photoUrl: string): Promise<File> {
  if (photoUrl.startsWith('data:')) {
    const [header, base64] = photoUrl.split(',')
    const mimeType = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg'
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: mimeType })
    const ext = mimeType.split('/')[1] ?? 'jpg'
    return new File([blob], `photo.${ext}`, { type: mimeType })
  }

  // ObjectURL (blob:)
  const res = await fetch(photoUrl)
  const blob = await res.blob()
  const ext = blob.type.split('/')[1] ?? 'jpg'
  return new File([blob], `photo.${ext}`, { type: blob.type || 'image/jpeg' })
}
