package com.roomrent.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Backing document for the numeric auto-increment id generator. One document
 * per collection (e.g. {@code users_seq}) holds the last-issued sequence value.
 */
@Document(collection = "database_sequences")
@Getter
@Setter
public class DatabaseSequence {

    @Id
    private String id;

    private long seq;
}
