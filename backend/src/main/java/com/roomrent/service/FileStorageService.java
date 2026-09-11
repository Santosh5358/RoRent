package com.roomrent.service;

import com.roomrent.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> ALLOWED_EXT =
            Set.of("jpg", "jpeg", "png", "webp");

    private final Path root;

    public FileStorageService(@Value("${app.upload.dir}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory", e);
        }
    }

    /**
     * Validates and stores an uploaded meter image. Returns the public URL path
     * (e.g. /uploads/meters/abc.png).
     */
    public String storeMeterImage(MultipartFile file) {
        return store(file, "meters");
    }

    /**
     * Validates and stores an uploaded payment slip image. Returns the public
     * URL path (e.g. /uploads/slips/abc.png).
     */
    public String storeSlipImage(MultipartFile file) {
        return store(file, "slips");
    }

    private String store(MultipartFile file, String subDir) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("No image file provided");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw ApiException.badRequest("Only JPG, PNG and WEBP images are allowed");
        }
        String ext = extensionOf(file.getOriginalFilename());
        if (!ALLOWED_EXT.contains(ext)) {
            throw ApiException.badRequest("Invalid image file extension");
        }

        try {
            Path dir = root.resolve(subDir);
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "." + ext;
            Path target = dir.resolve(filename).normalize();
            if (!target.startsWith(root)) {
                throw ApiException.badRequest("Invalid file path");
            }
            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return "/uploads/" + subDir + "/" + filename;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store image", e);
        }
    }

    private String extensionOf(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0) return "";
        return filename.substring(dot + 1).toLowerCase();
    }
}
