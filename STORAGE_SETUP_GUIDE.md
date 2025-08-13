# Supabase Storage Setup Guide for Image Uploads

This guide will help you set up Supabase Storage to handle image uploads for the "Others" items (snacks and accessories).

## 🚀 Quick Setup

### 1. Run the Storage SQL Script

Execute the following SQL script in your Supabase SQL Editor:

```sql
-- Setup script for Supabase Storage - Others Items
-- Run this in your Supabase SQL editor to create storage bucket and policies for others items

-- Create the others-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('others-images', 'others-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for admin users to upload others images
CREATE POLICY "Admins can upload others images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'others-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create policy for public read access to others images
CREATE POLICY "Public can view others images" ON storage.objects
FOR SELECT USING (bucket_id = 'others-images');

-- Create policy for admin users to update others images
CREATE POLICY "Admins can update others images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'others-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create policy for admin users to delete others images
CREATE POLICY "Admins can delete others images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'others-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
```

### 2. Verify Storage Bucket Creation

After running the script, you should see:
- A new bucket called `others-images` in your Supabase Storage dashboard
- Public read access enabled
- Admin-only upload/update/delete permissions

## 📁 Storage Structure

```
others-images/
├── others/
│   ├── 1703123456789-abc123.jpg
│   ├── 1703123456790-def456.png
│   └── ...
```

## 🔧 Features

### Image Upload Component
- **Drag & Drop**: Users can drag images directly onto the upload area
- **Click to Upload**: Traditional file picker interface
- **File Validation**: 
  - Only image files (PNG, JPG, GIF)
  - Maximum file size: 5MB
  - Automatic file type detection
- **Preview**: Real-time image preview after upload
- **Progress Indicator**: Loading state during upload
- **Error Handling**: User-friendly error messages

### Security Features
- **Admin-Only Uploads**: Only users with admin role can upload images
- **Public Read Access**: Images are publicly accessible for display
- **Unique File Names**: Prevents filename conflicts
- **File Size Limits**: Prevents abuse and storage bloat

## 🎯 Usage

### In Admin Others Page
The image upload component is now integrated into the admin others page:

1. **Add New Item**: Click "Add Item" button
2. **Upload Image**: Use the drag & drop area or click to select file
3. **Preview**: See the uploaded image immediately
4. **Save**: The image URL is automatically saved with the item

### Component Props
```typescript
<ImageUpload
  value={imageUrl}           // Current image URL
  onChange={setImageUrl}     // Callback when image changes
  bucket="others-images"     // Storage bucket name
  folder="others"           // Subfolder within bucket
  disabled={false}          // Disable upload functionality
  className="custom-class"  // Additional CSS classes
/>
```

## 🔍 Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check if user has admin role
   - Verify storage bucket exists
   - Check file size (max 5MB)
   - Ensure file is an image

2. **Images Not Displaying**
   - Verify bucket is public
   - Check storage policies
   - Ensure correct bucket name

3. **Permission Errors**
   - Verify user is authenticated
   - Check user has admin role
   - Review storage policies

### Debug Steps

1. **Check Storage Dashboard**
   - Go to Supabase Dashboard > Storage
   - Verify `others-images` bucket exists
   - Check bucket is public

2. **Verify Policies**
   - Go to Supabase Dashboard > Storage > Policies
   - Ensure all policies are active
   - Check policy conditions

3. **Test Upload**
   - Try uploading a small test image
   - Check browser console for errors
   - Verify file appears in storage

## 📊 Storage Management

### Monitoring Usage
- Track storage usage in Supabase Dashboard
- Monitor upload frequency
- Set up alerts for storage limits

### Cleanup
- Regularly review uploaded images
- Remove unused images
- Archive old images if needed

### Backup
- Consider backing up important images
- Export storage data periodically
- Document image organization

## 🔒 Security Best Practices

1. **File Validation**: Always validate file types and sizes
2. **Access Control**: Use role-based permissions
3. **Public URLs**: Only make necessary images public
4. **Monitoring**: Track upload patterns for abuse
5. **Backup**: Regular backups of important images

## 🚀 Next Steps

After setting up storage:

1. **Test the Upload**: Try uploading images in the admin panel
2. **Verify Display**: Check images appear correctly on frontend
3. **Monitor Usage**: Keep an eye on storage usage
4. **Optimize**: Consider image compression if needed

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase Storage documentation
3. Check browser console for error messages
4. Verify all SQL scripts executed successfully 